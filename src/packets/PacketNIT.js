import Packet from './Packet';

export class NITStream {
    id = 0;
    originalNetworkId = 0;
    descriptorLength = 0;
    descriptors = [];
};

export default class PacketNIT extends Packet {
    descriptorLength = 0;
    descriptors = [];
    streamLength;
    streams = [];

    constructor(data) {
        super(data);
    }
};
