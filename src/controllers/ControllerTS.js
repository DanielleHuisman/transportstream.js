import through from 'through2';

import {PACKET_LENGTH, PACKET_IDENTIFIERS, NULL_PACKET, TABLE_IDENTIFIERS} from '../constants';
import {PacketPAT} from '../packets';
import {ParserTS, ParserPSI, ParserPES, tableParsers} from '../parsers';
import {mergeUint8Arrays} from '../util';
import Controller from './Controller';

export default class ControllerTS extends Controller {
    stream = null;
    maxPackets = -1;

    parser = new ParserTS();
    parserPSI = new ParserPSI();
    parserPES = new ParserPES();
    packetCounter = 0;
    _isPacketStreamEnabled = false;
    _isStreamEnabled = {
        0: true // Program Association Table
    };
    _packetStream = through.obj();
    _pidStarted = {};
    _pidBuffers = {};
    _pidStreams = {};
    _programMapTables = {};
    _cache = {};

    constructor(stream, maxPackets) {
        super('TS');
        this.stream = stream;
        this.maxPackets = maxPackets;
    }

    start() {
        this.stream.on('readable', () => {
            let data = null;

            // Read all available packets
            while ((data = this.stream.read(PACKET_LENGTH)) !== null) {
                try {
                    // Discard incomplete packets
                    if (data.length < PACKET_LENGTH) {
                        console.log('incomplete, length:', data.length);
                        return;
                    }

                    // Parse Transport Stream packet
                    const packetTS = this.parser.parse(data);

                    // Push the parsed packet to the packet stream
                    if (this.isPacketStreamEnabled()) {
                        this._packetStream.push(packetTS);
                    }

                    // Stop parsing payload if it's a null packet
                    if (packetTS.pid === NULL_PACKET) {
                        return;
                    }

                    // Create the PID buffer and stream if they don't already exist
                    if (!this._pidStreams[packetTS.pid]) {
                        this._pidBuffers[packetTS.pid] = [];
                        this._pidStreams[packetTS.pid] = through.obj();

                        // Emit event
                        this.emit('pid', packetTS.pid);
                    }

                    // If a new payload starts parse the PID buffer and push the result to the PID stream
                    if (packetTS.payloadUnitStartIndicator && this._pidBuffers[packetTS.pid].length > 0) {
                        // Check if the PID stream is enabled (prevents unnecesarry parsing)
                        if (this.isStreamEnabled(packetTS.pid)) {
                            // Parse the packet
                            const packet = this.parsePacket(packetTS.pid, mergeUint8Arrays(this._pidBuffers[packetTS.pid]));

                            // Handle certain packets ourselves before passing them on
                            if (packet instanceof PacketPAT) {
                                this.handlePAT(packet);
                            }

                            // Push the packet to the PID stream
                            this._pidStreams[packetTS.pid].push(packet);
                        }

                        // Clear the PID buffer
                        this._pidBuffers[packetTS.pid] = [];
                    }

                    // TODO: check packet continuity counter

                    // Append the packet payload to the PID buffer
                    if (packetTS.payload) {
                        this._pidBuffers[packetTS.pid].push(packetTS.payload);
                    }

                    // End stream after a few packets
                    if (this.maxPackets >= 0 && this.packetCounter >= this.maxPackets) {
                        console.log('ending stream after', this.packetCounter, 'packets');
                        this.stream.destroy();
                    } else {
                        this.packetCounter++;
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        }).on('end', () => {
            console.log('stream ended');
        }).on('error', (err) => {
            console.error(err);
        });
    }

    isPacketStreamEnabled() {
        return this._isPacketStreamEnabled;
    }

    toggleStream() {
        this._isPacketStreamEnabled = !this._isPacketStreamEnabled;
    }

    enablePacketStream() {
        this._isPacketStreamEnabled = true;
    }

    disablePacketStream() {
        this._isPacketStreamEnabled = true;
    }

    isStreamEnabled(pid) {
        return this._isStreamEnabled[pid] || false;
    }

    toggleStream(pid) {
        this._isStreamEnabled[pid] = !this._isStreamEnabled[pid];
    }

    enableStream(pid) {
        this._isStreamEnabled[pid] = true;
    }

    disableStream(pid) {
        this._isStreamEnabled[pid] = true;
    }

    getPacketCount() {
        return this.packetCounter;
    }

    getPacketStream() {
        return this._packetStream;
    }

    getStreams() {
        return this._pidStreams;
    }

    getStream(pid) {
        return this._pidStreams[pid];
    }

    hasStream(pid) {
        return this._pidStreams[pid] !== undefined && this._pidStreams[pid] !== null;
    }

    getProgramMapTables() {
        return this._programMapTables;
    }

    parsePacket(pid, data) {
        // Check if the packet is a PSI table
        if (PACKET_IDENTIFIERS[pid] || this._programMapTables[pid]) {
            return this.parseTable(pid, data);
        }

        // Unsupported packet, return raw data
        return this.parsePES(pid, data);
    }

    parseTable(pid, data) {
        // Parse PSI table header
        const packetPSI = this.parserPSI.parse(data);

        // Find table specific parser
        const table = TABLE_IDENTIFIERS[packetPSI.tableId];
        if (table && tableParsers[table]) {
            // Check if this PID is allowed to contain the table
            if (pid >= 32 || (PACKET_IDENTIFIERS[pid] && PACKET_IDENTIFIERS[pid].indexOf(table) !== -1)) {
                // Parse packet
                const packet = tableParsers[table].parse(packetPSI.tableData);
                packet.parent = packetPSI;

                // Free duplicate and unused memory
                delete packet.parent.data;
                delete packet.parent.tableData;

                return packet;
            }
        }

        // Unsupported packet, return raw data
        return data;
    }

    parsePES(pid, data) {
        // Parse PES header
        return this.parserPES.parse(data);
    }

    handlePAT(packet) {
        // Check if the PAT is currently active and not a preview of the next PAT
        if (!packet.parent.isCurrent) {
            return;
        }

        // Check if the PMT wasn't already processed
        if (this._cache[packet.pcrPID] === packet.parent.versionNumber) {
            return;
        }

        // Update the PMT cache
        this._cache[packet.pcrPID] = packet.parent.versionNumber;

        // TODO: handle add/update/remove of PIDs better

        // Register programs in the new Program Map Table
        const tables = {};
        const updates = [];
        for (const program of packet.programs) {
            // Check if anything has changed
            if (this._programMapTables[program.pid] !== program.number) {
                updates.push(program.pid);
            }

            tables[program.pid] = program.number;
        }

        // Override the old tables
        this._programMapTables = tables;

        // Emit event if anything was changed
        if (updates.length > 0) {
            this.emit('pat', this._programMapTables, updates);
        }
    }
}
