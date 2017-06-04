import {PacketEIT, EITEvent} from '../packets';
import {parseDatetime, parseBCDFullSeconds} from '../util';
import {parseDescriptor} from './ParserPSI';
import Parser from './Parser';

export default class ParserEIT extends Parser {
    constructor() {
        super('EIT');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketEIT(data);

        // Parse EIT header
        packet.transportStreamId = data[0] << 8 | data[1];
        packet.originalNetworkId = data[2] << 8 | data[3];
        packet.segmentLastSectionNumber = data[4];
        packet.lastTableId = data[5];

        // Parse EIT services
        let index = 6;
        while (index < data.length) {
            // Parse EIT service
            const event = new EITEvent();

            event.id = data[index] << 8 | data[index + 1];
            index += 2;
            event.startTime = parseDatetime(data, index);
            index += 5;
            event.duration = parseBCDFullSeconds(data, index);
            index += 3;

            event.runningStatus = (data[index] & 0xe0) >> 5;
            event.hasCA = (data[index] & 0x10) !== 0;
            event.descriptorLength = (data[index] & 0x0f) << 8 | data[index + 1];
            index += 2;

            // Loop over EIT service descriptors
            let subindex = 0;
            while (subindex < event.descriptorLength && subindex < data.length - index) {
                // Parse EIT service descriptor
                const descriptor = parseDescriptor(data, index + subindex, 'EIT');
                event.descriptors.push(descriptor);

                subindex += 2 + descriptor.length;
            }
            index += subindex;

            packet.events.push(event);
        }

        return packet;
    }
};
