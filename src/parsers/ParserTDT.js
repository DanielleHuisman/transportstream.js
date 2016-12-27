import {PacketTDT} from '../packets';
import Parser from './Parser';

export default class ParserTDT extends Parser {
    constructor() {
        super('TDT');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketTDT();

        // Convert weird datetime format to UTC
        const mjd = data[0] << 8 | data[1];
        let years = Math.floor((15078.2) / 365.25);
        let months = Math.floor((mjd - 14956.1 - Math.floor(years * 365.25)) / 30.6001);
        const days = 0;

        const k = months === 14 || months === 15 ? 1 : 0;
        years += k;
        months -= 1 + k * 12;

        const hours = (data[2] & 0xf0) * 10 + data[2] & 0x0f;
        const minutes = (data[3] & 0xf0) * 10 + data[3] & 0x0f;
        const seconds = (data[4] & 0xf0) * 10 + data[4] & 0x0f;

        packet.utc = Date.parse(`${years}-${months}-${days} ${hours}:${minutes}:${seconds}`);
        packet._original = {
            mjd,
            hours,
            minutes,
            seconds
        };

        return packet;
    }
};
