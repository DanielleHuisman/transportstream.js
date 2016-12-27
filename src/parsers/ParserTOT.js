import {parseDatetime} from '../util';
import {PacketTOT} from '../packets';
import {parseDescriptor} from './ParserPSI';
import Parser from './Parser';

export default class ParserTOT extends Parser {
    constructor() {
        super('TOT');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketTOT(data);

        // Parse UTC time
        packet.utc = parseDatetime(data, 0);
        packet.descriptorLength = (data[5] & 0x0f) << 8 | data[6];

        // Loop over TOT descriptors
        let index = 4;
        while (index < packet.programInfoLength) {
            // Parse TOT descriptor
            const descriptor = parseDescriptor(data, index);
            packet.descriptors.push(descriptor);

            index += 2 + descriptor.length;
        }

        return packet;
    }
};
