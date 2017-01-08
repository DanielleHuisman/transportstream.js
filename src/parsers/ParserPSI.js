import CRC32 from 'crc-32';

import {PacketPSI, PSIDescriptor} from '../packets';
import Parser from './Parser';
import ParserDescriptor from './ParserDescriptor';

// Initialize descriptor parser
const parserDescriptor = new ParserDescriptor();

export const parseDescriptor = (data, index, ...args) => {
    // Initialize descriptor
    const descriptor = new PSIDescriptor();

    // Parse descriptor
    descriptor.tag = data[index];
    descriptor.length = data[index + 1];
    descriptor.data = data.slice(index + 2, index + 2 + descriptor.length);

    // Parse descriptor specific data
    parserDescriptor.parse(descriptor, ...args);

    return descriptor;
};

export default class ParserPSI extends Parser {
    constructor() {
        super('PSI');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketPSI(data);

        // Parse table header
        packet.tableId = data[0];
        packet.hasSyntaxSection = (data[1] & 0x80) !== 0;
        packet.privateBit = (data[1] & 0x40) !== 0;
        packet.sectionLength = (data[1] & 0x03) << 8 | data[2];

        packet.tableData = data.slice(3, 3 + packet.sectionLength);

        // Parse syntax section
        if (packet.hasSyntaxSection) {
            packet.tableIdExtension = packet.tableData[0] << 8 | packet.tableData[1];
            packet.versionNumber = (packet.tableData[2] & 0x3e) >> 1;
            packet.isCurrent = (packet.tableData[2] & 0x01) !== 0;
            packet.sectionNumber = packet.tableData[3];
            packet.lastSectionNumber = packet.tableData[4];

            // Parse CRC32 checksum
            packet.crc32 = packet.tableData.slice(-4).reduce((final, value) => final << 8 | value, 0);

            // Split off syntax section and CRC32
            packet.tableData = packet.tableData.slice(5, packet.tableData.length - 4);

            // Calculate checksum
            const checksum = CRC32.buf(data.slice(0, data.length - 4));
            if (packet.crc32 === checksum) {
                console.log('CHECKSUM success');
            }
            if (packet.crc32 !== checksum) {
                // throw new ParseError(this, `Invalid CRC32 checksum: ${packet.crc32} (received) !== ${checksum} (calculated)`);
            }
        }

        return packet;
    }
};
