import PacketPAT, {PATProgram} from '../packets/PacketPAT';
import Parser from './Parser';

export default class ParserPAT extends Parser {
    constructor() {
        super('PAT');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketPAT(data);

        // Loop over PAT programs
        for (let i = 0; i < data.length; i += 4) {
            // Parse PAT program
            const program = new PATProgram();

            program.number = data[i] << 8 | data[i + 1];
            program.pid = (data[i + 2] & 0x1f) << 8 | data[i + 3];

            packet.programs.push(program);
        }

        return packet;
    }
};
