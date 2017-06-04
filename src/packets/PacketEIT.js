import Packet from './Packet';

export class EITEvent {
    id = 0;
    startTime = 0;
    duration = 0;
    runningStatus = 0;
    hasCA = false;
    descriptorLength = 0;
    descriptors = [];
};

export default class PacketEIT extends Packet {
    transportStreamId = 0;
    originalNetworkId = 0;
    segmentLastSectionNumber = 0;
    lastTableId = 0;
    events = [];

    constructor(data) {
        super(data);
    }
};
