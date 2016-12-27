export default class PacketPSI extends Packet {
    tableId = 0;
    sectionSyntaxIndicator = false;
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
