import through from 'through2';

import {PACKET_IDENTIFIERS, NULL_PACKET} from '../constants';
import {ParserTS, tableParsers} from '../parsers';
import {mergeUint8Arrays} from '../util';
import Controller from './Controller';

export default class ControllerTS extends Controller {
    stream = null;
    maxPackets = -1;

    parser = new ParserTS();
    packetCounter = 0;
    _packetStream = through();
    _pidBuffers = {};
    _pidStreams = {};

    constructor(stream, maxPackets) {
        super('TS');
        this.stream = stream;
        this.maxPackets = maxPackets;
    }

    start() {
        this.stream.on('readable', () => {
            let data = null;

            // Read packets until the stream ends
            while ((data = this.stream.read(188)) !== null) {
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

                    // Handle new PID stream
                    this.handlePID();

                    // Emit event
                    this.emit('pid', packetTS.pid);
                }

                // If a new payload starts push the PID buffer to the PID stream
                if (packetTS.payloadUnitStartIndicator && this._pidBuffers[packetTS.pid].length > 0) {
                    this._pidStreams[packetTS.pid].push(this._pidBuffers[packetTS.pid]);
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

    handlePID(pid) {
        if (PACKET_IDENTIFIERS[pid]) {
            // TODO: create stream reader for PSI parser and afterwards for the table specific parser
        }

        // TODO: look up pid in PAT table to check for PMT
    }
}
