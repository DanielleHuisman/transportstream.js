import {PacketNIT, NITStream} from '../packets';
import {parseDescriptor} from './ParserPSI';
import Parser from './Parser';

export default class ParserNIT extends Parser {
    constructor() {
        super('NIT');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketNIT(data);

        packet.descriptorLength = (data[0] & 0x0f) << 8 | data[1];

        // Loop over NIT descriptors
        let index = 2;
        while (index < packet.descriptorLength) {
            // Parse NIT descriptor
            const descriptor = parseDescriptor(data, index);
            packet.descriptors.push(descriptor);

            index += 2 + descriptor.length;
        }

        packet.streamLength = (data[index] & 0x0f) << 8 | data[index + 1];
        index++;

        // Loop over NIT streams
        while (index < packet.streamLength) {
            // Parse NIT stream
            const stream = new NITStream();

            stream.id = data[index] << 8 | data[index + 1];
            stream.originalNetworkId = data[index + 2] << 8 | data[index + 3];
            stream.descriptorLength = (data[index + 4] & 0x0f) << 8 | data[index + 5];
            index += 6;

            // Loop over NIT stream descriptors
            let subindex = 0;
            while (subindex < stream.descriptorLength) {
                // Parse NIT stream descriptor
                const descriptor = parseDescriptor(data, index + subindex);
                stream.descriptors.push(descriptor);

                subindex += 2 + descriptor.length;
            }
            index += subindex;

            packet.streams.push(stream);
        }

        return packet;
    }
};
