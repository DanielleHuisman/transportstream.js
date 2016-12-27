import Packet from './Packet';

export default class PacketTDT extends Packet {
    utc = 0;
    _original = null;

    constructor(data) {
        super(data);
    }
};
