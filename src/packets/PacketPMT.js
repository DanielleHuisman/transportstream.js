import Packet from './Packet';

export class PMTDescriptor {
    tag = 0;
    length = 0;
    data = null;
};

export class PMTStream {
    type = 0;
    pid = 0;
    infoLength = 0;
    descriptors = [];
};

export default class PacketPMT extends Packet {
    pcrPID = 0;
    programInfoLength = 0;
    programDescriptors = [];
    streams = [];

    constructor(data) {
        super(data);
    }
};
