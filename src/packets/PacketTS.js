export default class PacketTS extends Packet {
    errorIndicator = false;
    payloadUnitStartIndicator = false;
    priority = false;
    pid = 0;
    scramblingControl = 0;
    hasAdaption = false;
    hasPayload = false;
    continuityCounter = 0;

    adaptionLength = 0;
    discontinuityIndicator = false;
    randomAccessInicator = false;
    elementaryStreamPriority = false;
    hasPCR = false;
    hasOPCR = false;
    hasSplicingPoint = false;
    hasPrivateData = false;
    hasAdaptionExtension = false;

    pcrBase = 0;
    pcrExtension = 0;
    pcr = 0;

    opcrBase = 0;
    opcrExtension = 0;
    opcr = 0;

    splicingPoint = 0;
    privateData = null;
    adaptionExtension = null;

    payload = null;

    constructor(data) {
        super(data);
    }
};
