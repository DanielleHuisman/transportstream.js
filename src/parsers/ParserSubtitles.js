import {PacketSubtitles, SubtitleSegment} from '../packets';
import Parser from './Parser';
import ParserSubtitleSegment from './ParserSubtitleSegment';

// Initialize subtitle segment parser
const parserSegment = new ParserSubtitleSegment();

export const parseSubtitleSegment = (data, index) => {
    // Initialize segment
    const segment = new SubtitleSegment();

    // Parse segment header
    segment.type = data[index + 1];
    segment.pageId = data[index + 2];
    segment.length = data[index + 3] << 8 | data[index + 4];

    // Parse segment data
    segment.data = data.slice(index + 5, index + 5 + segment.length);

    // Parse segment specific data
    parserSegment.parse(segment);

    return segment;
};

export default class ParserSubtitles extends Parser {
    constructor() {
        super('Subtitles');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketSubtitles();

        // Parse subtitles header
        packet.identifier = data[0];
        packet.streamId = data[1];

        // Loop over all subtitle segments
        let index = 2;
        while (data[index] === 0x0f) {
            // Parse subtitle segment
            const segment = parseSubtitleSegment(data, index);
            packet.segments.push(segment);

            index += 5 + segment.length;
        }

        return packet;
    }
};
