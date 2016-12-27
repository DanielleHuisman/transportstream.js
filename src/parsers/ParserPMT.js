import PacketPMT, {PMTDescriptor, PMTStream} from '../packets/PacketPMT';
import Parser from './Parser';

export default class ParserPMT extends Parser {
    constructor() {
        super('PMT');
    }

    parseDescriptor(data, index) {
        // Parse PMT descriptor
        const descriptor = new PMTDescriptor();

        descriptor.tag = data[index];
        descriptor.length = data[index + 1];
        descriptor.data = data.slice(index + 2, index + 2 + descriptor.length);

        return descriptor;
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketPMT(data);

        packet.pcrPID = (data[0] & 0x1f) << 8 | data[1];
        packet.programInfoLength = (data[2] & 0x03) << 8 | data[3];

        // Loop over PMT descriptors
        let index = 4;
        while (index < packet.programInfoLength) {
            // Parse PMT descriptor
            const descriptor = this.parseDescriptor(data, index);
            packet.programDescriptors.push(descriptor);

            index += 2 + descriptor.length;
        }

        // Loop over PMT elementary streams
        while (index < data.length) {
            // Parse PMT elementary stream
            const stream = new PMTStream();

            stream.type = data[index];
            stream.pid = (data[index + 1] & 0x1f) << 8 | data[index + 2];
            stream.infoLength = (data[index + 3] & 0x03) << 8 | data[index + 4];
            index += 5;

            // Loop over PMT elementary stream descriptors
            let subindex = 0;
            while (subindex < stream.infoLength) {
                // Parse elementary stream descriptor
                const descriptor = this.parseDescriptor(data, index + subindex);
                stream.descriptors.push(descriptor);

                subindex += 2 + descriptor.length;
            }
            index += subindex;

            packet.streams.push(stream);
        }

        return packet;
    }
};
