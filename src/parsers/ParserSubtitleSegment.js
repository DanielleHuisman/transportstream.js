import {SUBTITLE_SEGMENTS} from '../constants';
import {ParseError} from '../errors';
import {SubtitleSegment} from '../packets';
import Parser from './Parser';

const split = (data, start, size, func) => {
    const list = [];
    for (let i = start; i < data.length; i += size) {
        list.push(func(data, i));
    }
    return list;
};

const segments = {
    display_definition_segment: (desc, data) => {
        const finalData = {
            versionNumber: (data[0] & 0xf0) >> 4,
            hasDisplayWindow: (data[0] & 0x80) !== 0,
            displayWidth: data[1] << 8 | data[2],
            displayHeight: data[3] << 8 | data[4]
        };
        const index = 5;

        if (finalData.hasDisplayWindow) {
            finalData.windowHorizontalMin = data[index] << 8 | data[index + 1];
            finalData.windowHorizontalMax = data[index + 2] << 8 | data[index + 3];
            finalData.windowVerticalMin = data[index + 4] << 8 | data[index + 5];
            finalData.windowVerticalMax = data[index + 6] << 8 | data[index + 7];
        }

        return finalData;
    },
    page_composition_segment: (desc, d) => ({
        timeOut: d[0],
        versionNumber: (d[1] & 0xf0) >> 4,
        state: (d[1] & 0xc0) >> 2,
        regions: split(d, 3, 6, (data, index) => ({
            id: data[index],
            horizontalAddress: data[index + 2] << 8 | data[index + 3],
            verticalAddress: data[index + 4] << 8 | data[index + 5],
        }))
    })
};

export default class ParserSegment extends Parser {
    constructor() {
        super('Subtitle Segment');
    }

    parse(segment) {
        // Validate segment
        if (!segment instanceof SubtitleSegment) {
            throw new ParseError(`Data should be an instance of SubtitleSegment`);
        }

        // Parse segment
        const parser = segments[SUBTITLE_SEGMENTS[segment.type]];
        if (parser) {
            segment.name = SUBTITLE_SEGMENTS[segment.type];
            segment.parsedData = parser(segment, segment.data);
            // console.log('parsed:', toHexByte(segment.type), SUBTITLE_SEGMENTS[segment.type], segment.parsedData);
        } else {
            if (SUBTITLE_SEGMENTS[segment.type]) {
                console.warn(`No segment parser for: ${SUBTITLE_SEGMENTS[segment.type]}`);
            } else {
                if (!segment.type) {
                    console.warn(`Segment has no tag`, segment);
                } else {
                    // console.warn(`No segment entry for: ${toHexByte(segment.type)}`);
                }
            }
        }
    }
};
