import {parseDatetime} from '../util';
import {PacketTDT} from '../packets';
import Parser from './Parser';

export default class ParserTDT extends Parser {
    constructor() {
        super('TDT');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketTDT(data);

        // Parse UTC time
        packet.utc = parseDatetime(data, 0);

        return packet;
    }
};
