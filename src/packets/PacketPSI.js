import Packet from './Packet';

export class PSIDescriptor {
    tag = 0;
    length = 0;
    data = null;
    parsedData = null;
};

export default class PacketPSI extends Packet {
    tableId = 0;
    syntaxSectionIndicator = false;
    privateBit = false;
    sectionLength = 0;
    tableIdExtension = 0;
    versionNumber = 0;
    currentIndicator = false;
    sectionNumber = 0;
    lastSectionNumber = 0;
    tableData = null;
    crc32 = 0;

    constructor(data) {
        super(data);
    }
};
