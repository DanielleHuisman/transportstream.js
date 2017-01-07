import through from 'through2';

import {PACKET_LENGTH, PACKET_IDENTIFIERS, NULL_PACKET, TABLE_IDENTIFIERS} from '../constants';
import {PacketPAT} from '../packets';
import {ParserTS, ParserPSI, tableParsers} from '../parsers';
import {mergeUint8Arrays} from '../util';
import Controller from './Controller';

export default class ControllerTS extends Controller {
    stream = null;
    maxPackets = -1;

    parser = new ParserTS();
    parserPSI = new ParserPSI();
    packetCounter = 0;
    _packetStream = through.obj();
    _pidBuffers = {};
    _pidStreams = {};
    _programMapTables = {};

    constructor(stream, maxPackets) {
        super('TS');
        this.stream = stream;
        this.maxPackets = maxPackets;
    }

    start() {
        this.stream.on('readable', () => {
            let data = null;

            // Read packets until the stream ends
            while ((data = this.stream.read(PACKET_LENGTH)) !== null) {
                try {
                    // Discard incomplete packets
                    if (data.length < PACKET_LENGTH) {
                        return;
                    }

                    // Parse Transport Stream packet
                    const packetTS = this.parser.parse(data);

                    // Push the parsed packet to the packet stream
                    this._packetStream.push(packetTS);

                    // Stop parsing payload if it's a null packet
                    if (packetTS.pid === NULL_PACKET) {
                        return;
                    }

                    // Create the PID buffer and stream if they don't already exist
                    if (!this._pidStreams[packetTS.pid]) {
                        this._pidBuffers[packetTS.pid] = new Uint8Array();
                        this._pidStreams[packetTS.pid] = through.obj();

                        // Emit event
                        this.emit('pid', packetTS.pid);
                    }

                    // If a new payload starts parse the PID buffer and push the result to the PID stream
                    if (packetTS.payloadUnitStartIndicator && this._pidBuffers[packetTS.pid].length > 0) {
                        // Parse the packet
                        const packet = this.parsePacket(packetTS.pid, this._pidBuffers[packetTS.pid]);

                        // Handle certain packets ourselves before passing them on
                        if (packet instanceof PacketPAT) {
                            this.handlePAT(packet);
                        }

                        // Push the packet to the PID stream
                        this._pidStreams[packetTS.pid].push(packet);
                        this._pidBuffers[packetTS.pid] = new Uint8Array();
                    }

                    // Append the packet payload to the PID buffer
                    if (packetTS.payload) {
                        this._pidBuffers[packetTS.pid] = mergeUint8Arrays(this._pidBuffers[packetTS.pid], packetTS.payload);
                    }

                    // End stream after a few packets
                    if (this.maxPackets >= 0 && this.packetCounter > this.maxPackets) {
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

    getProgramMapTables() {
        return this._programMapTables;
    }

    parsePacket(pid, data) {
        // Check if the packet is a PSI table
        if (PACKET_IDENTIFIERS[pid] || this._programMapTables[pid]) {
            return this.parseTable(pid, data);
        }

        // Unsupported packet, return raw data
        return data;
    }

    parseTable(pid, data) {
        // Parse PSI table headers
        const packetPSI = this.parserPSI.parse(data);

        // Find table specific parser
        const table = TABLE_IDENTIFIERS[packetPSI.tableId];
        if (table && tableParsers[table]) {
            // Check if this PID is allowed to contain the table
            if (pid >= 32 || (PACKET_IDENTIFIERS[pid] && PACKET_IDENTIFIERS[pid].indexOf(table) !== -1)) {
                // Parse packet
                return tableParsers[table].parse(packetPSI.tableData);
            }
        }

        // Unsupported packet, return raw data
        return data;
    }

    handlePAT(packet) {
        // Register programs in the Program Map Table
        for (const program of packet.programs) {
            this._programMapTables[program.pid] = program.number;
        }
    }
}
