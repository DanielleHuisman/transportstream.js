import Packet from './Packet';

export class PMTStream {
    type = 0;
    typeString = null;
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
