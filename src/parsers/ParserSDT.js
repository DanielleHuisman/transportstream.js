import {PacketSDT, SDTService} from '../packets';
import {parseDescriptor} from './ParserPSI';
import Parser from './Parser';

export default class ParserSDT extends Parser {
    constructor() {
        super('SDT');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketSDT(data);

        // Parse SDT header
        packet.originalNetworkId = data[0] << 8 | data[1];

        // Parse SDT services
        let index = 3;
        while (index < data.length) {
            // Parse SDT service
            const service = new SDTService();

            service.id = data[index] << 8 | data[index + 1];
            service.hasEITSchedule = (data[index + 2] & 0x02) !== 0;
            service.hasEITFollowing = (data[index + 2] & 0x01) !== 0;
            service.runningStatus = (data[index + 3] & 0xe0) >> 5;
            service.hasCA = (data[index + 3] & 0x10) !== 0;
            service.descriptorLength = (data[index + 3] & 0x0f) << 8 | data[index + 4];
            index += 5;

            // Loop over SDT service descriptors
            let subindex = 0;
            while (subindex < service.descriptorLength) {
                // Parse SDT service descriptor
                const descriptor = parseDescriptor(data, index + subindex, 'SDT');
                service.descriptors.push(descriptor);

                subindex += 2 + descriptor.length;
            }
            index += subindex;

            packet.services.push(service);
        }

        return packet;
    }
};
