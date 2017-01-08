import {STREAM_TYPES} from '../constants';
import {PacketPMT, PMTStream} from '../packets';
import {toHexByte} from '../util';
import {parseDescriptor} from './ParserPSI';
import Parser from './Parser';

export default class ParserPMT extends Parser {
    constructor() {
        super('PMT');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketPMT(data);

        packet.pcrPID = (data[0] & 0x1f) << 8 | data[1];
        packet.programInfoLength = (data[2] & 0x03) << 8 | data[3];

        // Loop over PMT descriptors
        let index = 4;
        while (index < packet.programInfoLength) {
            // Parse PMT descriptor
            const descriptor = parseDescriptor(data, index, 'PMT');
            packet.programDescriptors.push(descriptor);

            index += 2 + descriptor.length;
        }

        // Loop over PMT elementary streams
        while (index < data.length) {
            // Parse PMT elementary stream
            const stream = new PMTStream();

            stream.type = data[index];
            stream.typeString = STREAM_TYPES[stream.type];
            if (!stream.typeString) {
                console.warn(`Unknown stream type: ${toHexByte(stream.type)}`);
            }
            stream.pid = (data[index + 1] & 0x1f) << 8 | data[index + 2];
            stream.infoLength = (data[index + 3] & 0x03) << 8 | data[index + 4];
            index += 5;

            // Loop over PMT elementary stream descriptors
            let subindex = 0;
            while (subindex < stream.infoLength) {
                // Parse elementary stream descriptor
                const descriptor = parseDescriptor(data, index + subindex, 'PMT');
                stream.descriptors.push(descriptor);

                subindex += 2 + descriptor.length;
            }
            index += subindex;

            packet.streams.push(stream);
        }

        return packet;
    }
};
