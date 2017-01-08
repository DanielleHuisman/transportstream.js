import Packet from './Packet';

export default class PacketPES extends Packet {
    // PES header
    streamId = 0;
    payloadLength = 0;
    scramblingControl = 0;
    isPriority = false;
    hasDataAlignment = false;
    hasCopyright = false;
    isOriginal = false;
    hasPTS = false;
    hasDTS = false;
    hasESCR = false;
    hasESRate = false;
    hasDSMTrickMode = false;
    hasAddinitionalCopyInfo = false;
    hasCRC = false;
    hasExtension = false;
    headerLength = 0;

    // PES header data controlled by flags
    pts = 0;
    dts = 0;
    escrBase = 0;
    escrExtension = 0;
    escr = 0;
    esRate = 0;
    dsmTrickMode = 0;
    dsmFieldId = 0;
    dsmIntraSliceRefresh = 0;
    dsmFrequencyTruncation = 0;
    dsmRepControl = 0;
    additionalCopyInfo = 0;
    previousPacketCRC = 0;

    // PES extension header
    hasPrivateData = false;
    hasPackHeader = false;
    hasProgramPacketSequenceCounter = false;
    hasPSTDBuffer = false;
    hasExtension2 = false;

    // PES extension
    privateData = null;
    packHeaderLength = 0;
    packHeader = 0;
    programPacketSequenceCounter = 0;
    isMPEG1 = false;
    originalStuffLength = 0;
    pstdBufferScale = 0;
    pstdBufferSize = 0;
    extension2Length = 0;
    hasStreamIdExtension = false;
    streamIdExtension = 0;

    // PES payload
    payload = null;

    constructor(data) {
        super(data);
    }
};
