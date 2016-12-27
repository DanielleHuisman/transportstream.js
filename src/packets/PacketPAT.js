import Packet from './Packet';

export class PATProgram {
    number = 0;
    pid = 0;
};

export default class PacketPAT extends Packet {
    programs = [];

    constructor(data) {
        super(data);
    }
};
