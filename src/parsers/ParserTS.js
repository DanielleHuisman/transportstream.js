import {ParseError} from '../errors';
import Parser fomr './Parser';

export default class ParserTS extends Parser {
    constructor() {
        super('TS');
    }

    parse(data) {
        // Validate packet length
        if (data.length !== 188) {
            throw new ParseError(this, `Invalid packet length (${data.length}), should be 188 bytes`);
        }

        // Validate first byte
        if (data[0] !== 0x47) {
            throw new ParseError(this, `Invalid first byte (${data[0].toString(16)}), should be 0x47`);
        }

        // Initialize packet
        const packet = new PacketTS(data);

        // Parse packet header
        packet.errorIndicator = (data[1] & 0x80) !== 0;
        packet.payloadUnitStartIndicator = (data[1] & 0x40) !== 0;
        packet.priority = (data[1] & 0x20) !== 0;
        packet.pid = (data[1] & 0x1f) << 8 | data[2];
        packet.scramblingControl = data[3] & 0xc0;
        packet.hasAdaption = (data[3] & 0x20) !== 0;
        packet.hasPayload = (data[3] & 0x10) !== 0;
        packet.continuityCounter = data[3] & 0x0f;

        // Define packet payload start
        let start = 4;

        // Parse packet adaption
        if (packet.hasAdaption) {
            packet.adaptionLength = data[4];

            if (packet.adaptionLength === 0) {
                packet.hasAdaption = false;
            } else {
                // Parse packet adaption fields
                packet.discontinuityIndicator = (data[5] & 0x80) !== 0;
                packet.randomAccessInicator = (data[5] & 0x40) !== 0;
                packet.elementaryStreamPriority = (data[5] & 0x20) !== 0;
                packet.hasPCR = (data[5] & 0x10) !== 0;
                packet.hasOPCR = (data[5] & 0x08) !== 0;
                packet.hasSplicingPoint = (data[5] & 0x04) !== 0;
                packet.hasPrivateData = (data[5] & 0x02) !== 0;
                packet.hasAdaptionExtension = (data[5] & 0x01) !== 0;

                start += 2;

                // Parse PCR (program clock reference)
                if (packet.hasPCR) {
                    const pcr = data.slice(start, start + 6);

                    packet.pcrBase = (pcr[0] << 25) | (pcr[1] << 17) | (pcr[ 2] << 9) | (pcr[3] << 1) | ((pcr[4] & 0x80) >> 7);
                    packet.pcrExtension = ((pcr[4] & 0x01) << 8) | pcr[5];
                    packet.pcr = packet.pcrBase * 300 + packet.pcrExtension;

                    start += 6;
                }

                // Parse OPCR (original program clock reference)
                if (packet.hasOPCR) {
                    const opcr = data.slice(start, start + 6);

                    packet.opcrBase = (opcr[0] << 25) | (opcr[1] << 17) | (opcr[ 2] << 9) | (opcr[3] << 1) | ((opcr[4] & 0x80) >> 7);
                    packet.opcrExtension = ((opcr[4] & 0x01) << 8) | opcr[5];
                    packet.opcr = packet.opcrBase * 300 + packet.opcrExtension;

                    start += 6;
                }

                // Parse splicing point
                if (packet.hasSplicingPoint) {
                    packet.splicingPoint = ((data[start] & 0x80) === 1 ? -1 : 1) * data[start] & 0x7f;
                    start++;
                }

                // Parse private data
                if (packet.hasPrivateData) {
                    packet.privateDataLength = data[start];
                    start++;

                    packet.privateData = data.slice(start, start + packet.privateDataLength);
                    start += packet.privateDataLength;
                }

                // Parse adaption extension
                if (packet.hasAdaptionExtension) {
                    packet.adaptionExtensionLength = data[start];

                    // TODO: parse adaption extension

                    start += packet.adaptionExtensionLength;
                }
            }
        }

        // Parse packet pointer
        if (packet.payloadUnitStartIndicator) {
            const fillerBytes = data[start];
            start += 1 + fillerBytes;
        }

        // Parse packet payload
        if (packet.hasPayload) {
            packet.payload = data.slice(start, 188);
        }

        return packet;
    }
};
