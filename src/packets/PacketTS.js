import Packet from './Packet';

export default class PacketTS extends Packet {
    // Packet header
    errorIndicator = false;
    payloadUnitStartIndicator = false;
    priority = false;
    pid = 0;
    scramblingControl = 0;
    hasAdaption = false;
    hasPayload = false;
    continuityCounter = 0;

    // Adaption field
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

    // Adaption extension field
    hasLegalTimeWindow = false;
    hasPiecewiseRate = false;
    hasSeamlessSplice = false;

    isLegalTimeWindowValid = false;
    legalTimeWindowOffset = 0;
    piecewiseRate = 0;
    spliceType = 0;
    spliceDTS = null;

    // Packet payload
    fillerBytes = 0;
    payload = null;

    constructor(data) {
        super(data);
    }
};
