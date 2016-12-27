import Packet from './Packet';

export default class PacketPAT extends Packet {
    programNumber = 0;
    programMapPID = 0;

    constructor(data) {
        super(data);
    }
};
