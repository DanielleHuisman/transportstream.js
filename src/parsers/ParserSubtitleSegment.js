import {SUBTITLE_SEGMENTS} from '../constants';
import {ParseError} from '../errors';
import {SubtitleSegment} from '../packets';
import {stringifyDvb, toHexByte} from '../util';
import Parser from './Parser';

const split = (data, start, size, func) => {
    const list = [];
    for (let i = start; i < data.length; i += size) {
        list.push(func(data, i));
    }
    return list;
};

const segments = {
    CLUT_definition_segment: (desc, data) => {
        const finalData = {
            id: data[0],
            versionNumber: (data[1] & 0xf0) >> 4,
            entries: []
        };
        let index = 2;
        while (index < data.length) {
            const entry = {
                id: data[index],
                is2bit: (data[index + 1] & 0x80) !== 0,
                is4bit: (data[index + 1] & 0x40) !== 0,
                is8bit: (data[index + 1] & 0x20) !== 0,
                isFullRange: (data[index + 1] & 0x01) !== 0
            };
            index += 2;

            if (entry.isFullRange) {
                entry.y = data[index];
                entry.cr = data[index + 1];
                entry.cb = data[index + 2];
                entry.t = data[index + 3];
                index += 4;
            } else {
                entry.y = (data[index] & 0xfc) >> 2;
                entry.cr = (data[index] & 0x03) | (data[index + 1] & 0xc0) >> 6;
                entry.cb = (data[index + 1] & 0x3c) >> 2;
                entry.t = data[index + 1] & 0x03;
                index += 2;
            }

            finalData.entries.push(entry);
        }

        return finalData;
    },
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
    end_of_display_set_segment: () => ({}),
    object_data_segment: (desc, data) => {
        const finalData = {
            id: data[0] << 8 | data[1],
            versionNumber: (data[2] & 0xf0) >> 4,
            codingMethod: (data[2] & 0x0c) >> 2,
            hasNonModidyingColour: (data[2] & 0x02) !== 0
        };
        let index = 3;

        if (finalData.codingMethod === 0) {
            finalData.topFieldLength = data[index] << 8 | data[index + 1];
            finalData.bottomFieldLength = data[index + 2] << 8 | data[index + 3];
            finalData.topField = [];
            finalData.bottomField = [];
            let subindex = 0;

            const parsePixelData = (i) => {
                const pixelData = {
                    type: data[i]
                };
                let si = 1;

                if (pixelData.type === 0x10) {
                    // TODO
                } else if (pixelData.type === 0x11) {
                    // TODO
                } else if (pixelData.type === 0x12) {
                    // TODO
                } else if (pixelData.type === 0x20) {
                    pixelData.table2to4 = {};
                    for (let j = 0; j < 2; j++) {
                        pixelData.table2to4[j] = data[i + si] & 0xf0;
                        pixelData.table2to4[j + 1] = data[i + si] & 0x0f;
                    }
                    si += 16;
                } else if (pixelData.type === 0x21) {
                    pixelData.table2to8 = {};
                    for (let j = 0; j < 4; j++) {
                        pixelData.table2to8[j] = data[i + si];
                    }
                    si += 32;
                } else if (pixelData.type === 0x22) {
                    pixelData.table4to8 = {};
                    for (let j = 0; j < 16; j++) {
                        pixelData.table4to8[j] = data[i + si];
                    }
                    si += 128;
                }

                pixelData.length = si;
                return pixelData;
            };

            while (subindex < finalData.topFieldLength) {
                break; // TODO
                const pixelData = parsePixelData(subindex);
                finalData.topField.push(pixelData);
                subindex += pixelData.length;
            }

            while (index < finalData.bottomFieldLength) {
                break; // TODO
                const pixelData = parsePixelData(subindex);
                finalData.topField.push(pixelData);
                subindex += pixelData.length;
            }

            index += subindex;
        } else if (finalData.codingMethod === 1) {
            finalData.length = data[index];
            finalData.text = stringifyDvb(data.slice(index + 1, index + 1 + finalData.length));
        }

        return finalData;
    },
    page_composition_segment: (desc, d) => ({
        timeOut: d[0],
        versionNumber: (d[1] & 0xf0) >> 4,
        state: (d[1] & 0x0c) >> 2,
        regions: split(d, 2, 6, (data, index) => ({
            id: data[index],
            horizontalAddress: data[index + 2] << 8 | data[index + 3],
            verticalAddress: data[index + 4] << 8 | data[index + 5],
        }))
    }),
    region_composition_segment: (desc, d) => {
        const finalData = {
            id: d[0],
            versionNumber: (d[1] & 0xf0) >> 4,
            isFilled: (d[1] & 0x08) !== 0,
            width: d[2] << 8 | d[3],
            height: d[4] << 8 | d[5],
            compatibility: (d[6] & 0xe0) >> 5,
            depth: (d[6] & 0x1c) >> 2,
            clutId: d[7],
            pixelCode8bit: d[8],
            pixelCode4bit: (d[9] & 0xf0) >> 4,
            pixelCode2bit: (d[9] & 0x0c) >> 2,
            objects: []
        };
        let index = 10;
        while (index < d.length) {
            const object = {
                id: d[index] << 8 | d[index + 1],
                type: (d[index + 2] & 0xc0) >> 6,
                provider: (d[index + 2] & 0x30) >> 4,
                horizontalPosition: (d[index + 2] & 0x0f) << 8 | d[index + 3],
                verticalPosition: (d[index + 4] & 0x0f) << 8 | d[index + 5]
            };
            index += 6;
            if (object.type === 0x01 || object.type === 0x02) {
                object.foreground = d[index];
                object.background = d[index + 1];
                index += 2;
            }
            finalData.objects.push(object);
        }

        return finalData;
    },
    stuffing_segment: () => ({})
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
                    console.warn(`No segment entry for: ${toHexByte(segment.type)}`);
                }
            }
        }
    }
};
