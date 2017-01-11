import {SUBTITLE_SEGMENT_TYPES} from '../constants';
import {PacketSubtitles, SubtitleSegment} from '../packets';
import Parser from './Parser';

export const parseSubtitleSegment = () => {

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

        // Loop over all segments
        let index = 2;
        while (data[index] === 0x0f) {
            const segment = new SubtitleSegment();

            // Parse segment header
            segment.type = data[index + 1];
            segment.pageId = data[index + 2];
            segment.length = data[index + 3] << 8 | data[index + 4];
            index += 5;

            // Parse segment data
            segment.data = data.slice(index, index + segment.length);
            index += segment.length;

            packet.segments.push(segment);
        }

        return packet;
    }
};
