import PacketPAT from '../packets/PacketPAT';
import Parser from './Parser';

export default class ParserPAT extends Parser {
    constructor() {
        super('PAT');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketPAT(data);

        // Parse PAT data
        packet.programNumber = data[0] << 8 | data[1];
        packet.programMapPID = (data[2] & 0x1f) << 8 | data[3];

        return packet;
    }
};
