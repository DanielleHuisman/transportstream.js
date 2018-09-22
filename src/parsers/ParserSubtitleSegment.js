import {SUBTITLE_SEGMENTS} from '../constants';
import {ParseError} from '../errors';
import {SubtitleSegment} from '../packets';
import {stringifyDvb, toHexByte} from '../util';
import Parser from './Parser';

const segments = {
    CLUT_definition_segment: (desc, stream) => {
        const data = {
            entries: []
        };

        data.id = stream.read(8);
        data.versionNumber = stream.read(4);
        stream.advance(4);

        let index = 2;
        while (index < desc.length) {
            const entry = {};
            entry.id = stream.read(8);
            entry.is2bit = stream.read(1) !== 0;
            entry.is4bit = stream.read(1) !== 0;
            entry.is8bit = stream.read(1) !== 0;
            stream.advance(4);
            entry.isFullRange = stream.read(1) !== 0;
            index += 2;

            if (entry.isFullRange) {
                entry.y = stream.read(8);
                entry.cr = stream.read(8);
                entry.cb = stream.read(8);
                entry.t = stream.read(8);
                index += 4;
            } else {
                entry.y = stream.read(6);
                entry.cr = stream.read(4);
                entry.cb = stream.read(4);
                entry.t = stream.read(2);
                index += 2;
            }

            data.entries.push(entry);
        }

        return data;
    },
    display_definition_segment: (desc, stream) => {
        const data = {};

        data.versionNumber = stream.read(4);
        data.hasDisplayWindow = stream.read(1) !== 0;
        stream.advance(3);
        data.displayWidth = stream.read(16);
        data.displayHeight = stream.read(16);

        if (data.hasDisplayWindow) {
            data.windowHorizontalMin = stream.read(16);
            data.windowHorizontalMax = stream.read(16);
            data.windowVerticalMin = stream.read(16);
            data.windowVerticalMax = stream.read(16);
        }

        return data;
    },
    end_of_display_set_segment: () => (desc, stream) => {
        stream.advance(desc.length);
        return {};
    },
    object_data_segment: (desc, stream) => {
        const data = {};

        data.id = stream.read(16);
        data.versionNumber = stream.read(4);
        data.codingMethod = stream.read(2);
        data.hasNonModidyingColour = stream.read(1) !== 0;
        stream.advance(1);

        if (data.codingMethod === 0) {
            data.topFieldLength = stream.read(16);
            data.bottomFieldLength = stream.read(16);
            data.topField = [];
            data.bottomField = [];
            let subindex = 0;

            const parsePixelData = (i) => {
                const pixelData = {
                    type: stream.read(8)
                };
                let si = 1;

                if (pixelData.type === 0x10) {
                    console.log('2 bit code');

                    pixelData.code2bit = [];
                    let end = false;
                    let bits = 0;
                    while (!end) {
                        const code1 = stream.read(2);
                        bits += 2;
                        if (code1 !== 0) {
                            pixelData.code2bit.push(code1);
                        } else {
                            bits++;
                            if (stream.read(1) !== 0) {
                                const runLength = stream.read(3);
                                const code2 = stream.read(2);
                                bits += 5;

                                for (let i = 0; i < runLength + 3; i++) {
                                    pixelData.code2bit.push(code2);
                                }
                            } else {
                                bits++;
                                if (stream.read(1) !== 0) {
                                    pixelData.code2bit.push(code1);
                                } else {
                                    const sw = stream.read(2);
                                    bits += 2;
                                    switch (sw) {
                                        case 0: {
                                            end = true;
                                            break;
                                        }
                                        case 1: {
                                            pixelData.code2bit.push(code1);
                                            pixelData.code2bit.push(code1);
                                            break;
                                        }
                                        case 2: {
                                            const runLength = stream.read(4);
                                            const code2 = stream.read(2);
                                            bits += 6;

                                            for (let i = 0; i < runLength + 12; i++) {
                                                pixelData.code2bit.push(code2);
                                            }
                                            break;
                                        }
                                        case 3: {
                                            const runLength = stream.read(8);
                                            const code2 = stream.read(2);
                                            bits += 10;

                                            for (let i = 0; i < runLength + 29; i++) {
                                                pixelData.code2bit.push(code2);
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    stream.advance(bits % 8);
                    si += Math.ceil(bits / 8);

                    console.log('MAGIC 2-BIT CODE', pixelData.code2bit);
                } else if (pixelData.type === 0x11) {
                    console.log('4 bit code');

                    pixelData.code4bit = [];
                    let end = false;
                    let bits = 0;
                    while (!end) {
                        const code1 = stream.read(4);
                        bits += 4;
                        if (code1 !== 0) {
                            pixelData.code4bit.push(code1);
                        } else {
                            bits++;
                            if (stream.read(1) === 0) {
                                const runLength = stream.read(3);
                                bits += 3;
                                if (runLength === 0) {
                                    end = true;
                                } else {
                                    for (let i = 0; i < runLength + 2; i++) {
                                        pixelData.code4bit.push(code1);
                                    }
                                }
                            } else {
                                bits++;
                                if (stream.read(1) === 0) {
                                    const runLength = stream.read(2);
                                    const code2 = stream.read(4);
                                    bits += 6;
                                    for (let i = 0; i < runLength + 4; i++) {
                                        pixelData.code4bit.push(code2);
                                    }
                                } else {
                                    const sw = stream.read(2);
                                    bits += 2;
                                    switch (sw) {
                                        case 0: {
                                            pixelData.code4bit.push(code1);
                                            break;
                                        }
                                        case 1: {
                                            pixelData.code4bit.push(code1);
                                            pixelData.code4bit.push(code1);
                                            break;
                                        }
                                        case 2: {
                                            const runLength = stream.read(4);
                                            const code2 = stream.read(4);
                                            bits += 8;

                                            for (let i = 0; i < runLength + 9; i++) {
                                                pixelData.code4bit.push(code2);
                                            }
                                            break;
                                        }
                                        case 3: {
                                            const runLength = stream.read(8);
                                            const code2 = stream.read(4);
                                            bits += 12;

                                            for (let i = 0; i < runLength + 25; i++) {
                                                pixelData.code4bit.push(code2);
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    console.log('read', bits, 'bits.', bits % 8, 'bits needed to align', 'read', Math.ceil(bits / 8), 'bytes');
                    console.log('stream offset', stream.offset(), 'bit offest', stream.bitPosition);
                    stream.advance(bits % 8);
                    si += Math.ceil(bits / 8);
                    console.log('stream offset', stream.offset(), 'bit offest', stream.bitPosition);

                    console.log('MAGIC 4-BIT CODE', pixelData.code4bit);
                } else if (pixelData.type === 0x12) {
                    console.log('8 bit code');

                    pixelData.code8bit = [];
                    let end = false;
                    let bits = 0;
                    while (!end) {
                        const code1 = stream.read(8);
                        bits += 8;
                        if (code1 !== 0) {
                            pixelData.code8bit.push(code1);
                        } else {
                            bits++;
                            if (stream.read(1) === 0) {
                                const runLength = stream.read(7);
                                bits += 7;
                                if (runLength === 0) {
                                    end = true;
                                } else {
                                    for (let i = 0; i < runLength; i++) {
                                        pixelData.code8bit.push(code1);
                                    }
                                }
                            } else {
                                const runLength = stream.read(7);
                                const code2 = stream.read(8);
                                bits += 15;
                                for (let i = 0; i < runLength; i++) {
                                    pixelData.code8bit.push(code2);
                                }
                            }
                        }
                    }

                    stream.advance(bits % 8);
                    si += Math.ceil(bits / 8);

                    console.log('MAGIC 8-BIT CODE', pixelData.code8bit);
                } else if (pixelData.type === 0x20) {
                    pixelData.table2to4 = {};
                    for (let j = 0; j < 2; j++) {
                        pixelData.table2to4[j] = stream.read(4);
                        pixelData.table2to4[j + 1] = stream.read(4);
                    }
                    si += 16;

                    console.log('TABLE 2-to-4', pixelData.table2to4);
                } else if (pixelData.type === 0x21) {
                    pixelData.table2to8 = {};
                    for (let j = 0; j < 4; j++) {
                        pixelData.table2to8[j] = stream.read(8);
                    }
                    si += 32;

                    console.log('TABLE 2-to-8', pixelData.table2to8);
                } else if (pixelData.type === 0x22) {
                    pixelData.table4to8 = {};
                    for (let j = 0; j < 16; j++) {
                        pixelData.table4to8[j] = stream.read(8);
                    }
                    si += 128;

                    console.log('TABLE 4-to-8', pixelData.table4to8);
                } else if (pixelData.type === 0xF0) {
                    console.log('end of object line code');
                } else {
                    console.log('UNKNOWN PIXEL DATA TYPE', toHexByte(pixelData.type));
                }

                pixelData.length = si;
                return pixelData;
            };

            console.group();
            console.log('TOP FIELD', data.topFieldLength, subindex);

            let line = [];
            while (subindex < data.topFieldLength) {
                const pixelData = parsePixelData(subindex);
                if (pixelData.type === 0xF0) {
                    data.topField.push(line);
                    line = [];
                } else {
                    line.push(pixelData);
                }

                subindex += pixelData.length;
                console.log('subindex', subindex, 'left', data.topFieldLength - subindex);
            }
            console.log(data.topField);
            console.groupEnd();


            console.group();
            console.log('BOTTOM FIELD', data.bottomFieldLength, subindex);
            while (subindex < data.bottomFieldLength) {
                console.log(toHexByte(stream.peek(8)));
                // break;
                const pixelData = parsePixelData(subindex);
                if (pixelData.type === 0xF0) {
                    data.bottomField.push(line);
                    line = [];
                } else {
                    line.push(pixelData);
                }

                subindex += pixelData.length;
                console.log('subindex', subindex, 'left', data.bottomFieldLength - subindex);
                if (data.bottomFieldLength - subindex < 0) {
                    break;
                }
            }
            console.log(data.bottomField);
            console.groupEnd();
        } else if (data.codingMethod === 1) {
            data.length = stream.read(8);
            data.text = [];
            for (let i = 0; i < data.length; i++) {
                data.text.push(stream.read(8));
            }
            data.text = stringifyDvb(data.text);
        } else if (data.codingMethod === 2) {
            data.bitmapWidth = data.read(16);
            data.bitmapHeight = data.read(16);
            data.compressedDataLength = data.read(16);
            data.compressedData = [];
            for (let i = 0; i < data.compressedDataLength; i++) {
                data.compressedData.push(stream.read(8));
            }
        }

        return data;
    },
    page_composition_segment: (desc, stream) => {
        const data = {
            regions: []
        };

        data.timeOut = stream.read(8);
        data.versionNumber = stream.read(4);
        data.state = stream.read(2);
        stream.advance(2);

        let index = 2;
        while (index < desc.length) {
            const region = {};
            region.id = stream.read(8);
            stream.advance(8);
            region.horizontalAddress = stream.read(16);
            region.verticalAddress = stream.read(16);
            index += 6;
            data.regions.push(region);
        }
        return data;
    },
    region_composition_segment: (desc, stream) => {
        const data = {
            objects: []
        };

        data.id = stream.read(8);
        data.versionNumber = stream.read(4);
        data.isFilled = stream.read(1) !== 0;
        stream.advance(3);
        data.width = stream.read(16);
        data.height = stream.read(16);
        data.compatibility = stream.read(3);
        data.depth = stream.read(3);
        stream.advance(2);
        data.clutId = stream.read(8);
        data.pixelCode8bit = stream.read(8);
        data.pixelCode4bit = stream.read(4);
        data.pixelCode2bit = stream.read(2);
        stream.advance(2);

        let index = 10;
        while (index < desc.length) {
            const object = {};
            object.id = stream.read(16);
            object.type = stream.read(2);
            object.provider = stream.read(2);
            object.horizontalPosition = stream.read(12);
            stream.advance(4);
            object.verticalPosition = stream.read(12);

            index += 6;
            if (object.type === 0x01 || object.type === 0x02) {
                object.foreground = stream.read(8);
                object.background = stream.read(8);
                index += 2;
            }
            data.objects.push(object);
        }

        return data;
    },
    stuffing_segment: (desc, stream) => {
        stream.advance(desc.length);
        return {};
    }
};

export default class ParserSegment extends Parser {
    constructor() {
        super('Subtitle Segment');
    }

    parse(segment, stream) {
        // Validate segment
        if (!segment instanceof SubtitleSegment) {
            throw new ParseError(`Data should be an instance of SubtitleSegment`);
        }

        // Parse segment
        const parser = segments[SUBTITLE_SEGMENTS[segment.type]];
        if (parser) {
            segment.name = SUBTITLE_SEGMENTS[segment.type];
            segment.parsedData = parser(segment, stream);
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
