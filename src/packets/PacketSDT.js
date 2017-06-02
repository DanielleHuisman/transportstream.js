import Packet from './Packet';

export class SDTService {
    id = 0;
    hasEITSchedule = false;
    hasEITFollowing = false;
    runningStatus = 0;
    hasCA = false;
    descriptorLength = 0;
    descriptors = [];
};

export default class PacketSDT extends Packet {
    originalNetworkId = 0;
    services = [];

    constructor(data) {
        super(data);
    }
};
