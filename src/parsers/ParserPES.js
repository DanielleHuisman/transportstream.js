import {ParseError} from '../errors';
import {PacketPES} from '../packets';
import {toHex} from '../util';
import Parser from './Parser';

export const streamsWithoutHeaders = [
    0xBC, // program_stream_map
    0xBE, // padding_stream
    0xBF, // private_stream_2
    0xF0, // ECM_stream
    0xF1, // EMM_stream
    0xF2, // DSMCC_stream
    0xF8, // ITU-T Rec. H.222.1 type E
    0xFF // prograem_stream_directory
];

export default class ParserPES extends Parser {
    constructor() {
        super('PES');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketPES(data);

        // Validate PES prefix
        const pesPrefix = data[0] << 16 | data[1] << 8 | data[2];
        if (pesPrefix !== 0x000001) {
            throw new ParseError(this, `Invalid PES prefix (${toHex(pesPrefix, 6)}), should be 0x000001`);
        }

        // Parse PES header
        packet.streamId = data[3];
        packet.pesLength = data[4] << 8 | data[5];

        // Define packet payload start
        let start = 6;

        // Parse PES header
        if (streamsWithoutHeaders.indexOf(packet.streamId) === -1) {
            packet.scramblingControl = (data[6] & 0x30) >> 4;
            packet.isPriority = (data[6] & 0x08) !== 0;
            packet.hasDataAlignment = (data[6] & 0x04) !== 0;
            packet.hasCopyright = (data[6] & 0x02) !== 0;
            packet.isOriginal = (data[6] & 0x01) !== 0;
            packet.hasPTS = (data[7] & 0x80) !== 0;
            packet.hasDTS = (data[7] & 0x40) !== 0;
            packet.hasESCR = (data[7] & 0x20) !== 0;
            packet.hasESRate = (data[7] & 0x10) !== 0;
            packet.hasDSMTrickMode = (data[7] & 0x08) !== 0;
            packet.hasAddinitionalCopyInfo = (data[7] & 0x04) !== 0;
            packet.hasCRC = (data[7] & 0x02) !== 0;
            packet.hasExtension = (data[7] & 0x01) !== 0;
            packet.headerLength = data[8];
            start += 9;

            // Parse presentation timestamp
            if (packet.hasPTS) {
                packet.pts = (data[start] & 0x07) << 29 | data[start + 1] << 21 | data[start + 2] << 14 | data[start + 3] << 7 | data[start + 4] >> 1;
                start += 5;
            }

            // Parse decoding timestamp
            if (packet.hasDTS) {
                packet.dts = (data[start] & 0x07) << 29 | data[start + 1] << 21 | data[start + 2] << 14 | data[start + 3] << 7 | data[start + 4] >> 1;
                start += 5;
            }

            // Parse elementary stream clock reference
            if (packet.hasESCR) {
                // TODO
                // paket.escrBase = (data[start] & 0x3c) << 29 | (data[start] & 0x01) << 28 | data[start + 1]

                // Calculate ESCR
                // packet.escr = packet.escrBase * 300 + packet.escrExtension;

                start += 6;
            }

            // Parse elementary stream rate
            if (packet.hasESRate) {
                packet.esRate = (data[start] & 0x7f) << 15 | data[start + 1] << 7 | (data[start + 2] & 0xfe) >> 1;
                start += 3;
            }

            // Parse DSM trick mode
            if (packet.hasDSMTrickMode) {
                // TODO
                start++;
            }

            // Parse additional copy info
            if (packet.hasAddinitionalCopyInfo) {
                packet.additionalCopyInfo = data[start] & 0x7f;
                start++;
            }

            // Parse CRC
            if (packet.hasCRC) {
                packet.previousPacketCRC = data[start] << 8 | data[start + 1];
                start += 2;
            }

            // Parse PES extension
            if (packet.hasExtension) {
                packet.hasPrivateData = (data[start] & 0x80) !== 0;
                packet.hasPackHeader = (data[start] & 0x40) !== 0;
                packet.hasProgramPacketSequenceCounter = (data[start] & 0x20) !== 0;
                packet.hasPSTDBuffer = (data[start] & 0x10) !== 0;
                packet.hasExtension2 = (data[start] & 0x01) !== 0;
                start++;

                // Parse private data
                if (packet.hasPrivateData) {
                    packet.privateData = data.slice(start, start + 16);
                    start += 16;
                }

                // Parse pack header
                if (packet.hasPackHeader) {
                    packet.packHeaderLength = data[start];
                    start++;

                    // TODO: parse pack header
                    start += packet.packHeaderLength;
                }

                // Parse program packet sequence counter
                if (packet.hasProgramPacketSequenceCounter) {
                    packet.programPacketSequenceCounter = data[start] & 0x7f;
                    packet.isMPEG1 = (data[start + 1] & 0x40) !== 1;
                    packet.originalStuffLength = data[start + 1] & 0x3f;
                    start += 2;
                }

                // Parse P-STD buffer
                if (packet.hasPSTDBuffer) {
                    packet.pstdBufferScale = (data[start] & 0x20) >> 5;
                    packet.pstdBufferSize = (data[start] & 0x1f) << 8 | data[start + 1];
                    start += 2;
                }

                // Parse PES extension 2
                if (packet.hasExtension2) {
                    packet.extension2Length = data[start] & 0x7f;
                    packet.hasStreamIdExtension = (data[start + 1] & 0x80) !== 0;
                    start++;

                    // Parse stream ID extension
                    if (packet.hasStreamIdExtension) {
                        packet.streamIdExtension = data[start] & 0x7f;
                    }

                    start += packet.extension2Length;
                }
            }

            // Skip any remaining stuffing bytes
            start = 9 + packet.headerLength;
        }

        // Parse payload
        packet.payload = data.slice(start);
    }
};
