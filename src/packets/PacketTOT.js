import Packet from './Packet';

export default class PacketTOT extends Packet {
    utc = 0;
    descriptorLength = 0;
    descriptors = [];

    constructor(data) {
        super(data);
    }
};
