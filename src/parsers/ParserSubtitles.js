import {BufferList, Buffer, Stream, Bitstream} from 'av';

import {PacketSubtitles, SubtitleSegment} from '../packets';
import {toHexByte} from '../util';
import Parser from './Parser';
import ParserSubtitleSegment from './ParserSubtitleSegment';

// Initialize subtitle segment parser
const parserSegment = new ParserSubtitleSegment();

export const parseSubtitleSegment = (stream) => {
    // Initialize segment
    const segment = new SubtitleSegment();

    // Parse segment header
    segment.type = stream.read(8);
    segment.pageId = stream.read(16);
    segment.length = stream.read(16);

    // Parse segment data
    // segment.data = data.slice(index + 6, index + 6 + segment.length);

    // Parse segment specific data
    parserSegment.parse(segment, stream);

    return segment;
};

export default class ParserSubtitles extends Parser {
    constructor() {
        super('Subtitles');
    }

    parse(data) {
        // Initialize packet
        const packet = new PacketSubtitles();

        const bufferList = new BufferList();
        const buffer = new Buffer(new Uint8Array(data));
        bufferList.append(buffer);
        const stream = new Stream(bufferList);
        const bitStream = new Bitstream(stream);

        // Parse subtitles header
        packet.identifier = bitStream.read(8);
        packet.streamId = bitStream.read(8);

        // Loop over all subtitle segments
        while (bitStream.read(8) === 0x0f && stream.remainingBytes() > 0) {
            // Parse subtitle segment
            const segment = parseSubtitleSegment(bitStream);
            packet.segments.push(segment);

            console.log('subtitle bytes left', stream.remainingBytes(), 'first byte', toHexByte(bitStream.peek(8)));

            if (bitStream.peek(8) !== 0x0f) {
                bitStream.rewind(1);
                const b = bitStream.read(8);

                console.error('ERRORERETET', 'prev', toHexByte(b));
            }
        }

        return packet;
    }
};
