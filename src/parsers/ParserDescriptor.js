import iconv from 'iconv-lite';

import {DESCRIPTORS} from '../constants';
import {ParseError} from '../errors';
import {PSIDescriptor} from '../packets';
import {toHexByte} from '../util';
import Parser from './Parser';

const buf = Buffer.from('test');
const enc = iconv.encode('test', 'ISO-8859-1');
console.log(buf[Symbol.toStringTag], buf.prototype);
console.log(buf, enc, iconv.decode(enc, 'ISO-8859-1'));

const stringify = (data) => {
    // TODO: use the proper encoding from iconv
    if (data[0] == 0xE0 && data[1] >= 0x80 && data[1] <= 0x9F) {
        // TODO: two byte control codes
    } else if (data[0] >= 0x80 && data[0] <= 0x9F) {
        // TODO: one byte control codes
    }

    let result = '';
    data.forEach((value) => {
        result += String.fromCharCode(value);
    });
    return result;
};

const split = (data, start, size, func) => {
    const list = [];
    for (let i = start; i < data.length; i += size) {
        list.push(func(data, i));
    }
    return list;
};

const descriptors = {
    AC3_descriptor: (desc, data) => {
        const result = {
            hasComponentType: (data[0] & 0x80) !== 0,
            hasBsid: (data[0] & 0x40) !== 0,
            hasMainId: (data[0] & 0x20) !== 0,
            hasAsvc: (data[0] & 0x10) !== 0
        };

        let start = 1;
        if (result.hasComponentType) {
            result.componentType = data[start];
            start++;
        }
        if (result.hasBsid) {
            result.bsid = data[start];
            start++;
        }
        if (result.hasMainId) {
            result.mainid = data[start];
            start++;
        }
        if (result.hasAsvc) {
            result.asvc = data[start];
            start++;
        }
        result.additionalInfo = data.slice(start, data.length);
        return result;
    },
    application_signalling_descriptor: (desc, d) => split(d, 0, 3, (data, i) => ({
        type: (data[0] & 0x7f) << 8 | data[1],
        versionNumber: data[i + 2] & 0x1f
    })),
    AVC_video_descriptor: (desc, data) => ({ // might contain more flags
        profileIdc: data[0],
        constaintSet0: (data[1] & 0x80) !== 0,
        constaintSet1: (data[1] & 0x40) !== 0,
        constaintSet2: (data[1] & 0x20) !== 0,
        avcCompatibleFlags: data[1] & 0x1f,
        levelIdc: data[2],
        avcStillPresent: (data[5] & 0x80) !== 0,
        avc24HourPictureFlag: (data[5] & 0x40) !== 0
    }),
    cable_delivery_system_descriptor: (desc, data) => ({
        frequency: data[0] << 24 | data[1] << 16 | data[2] << 8 | data[3],
        outerFEC: data[5] & 0x0f,
        modulation: data[6],
        symbolRate: data[7] << 20 | data[8] << 14 | data[9] << 4 | ((data[10] & 0xf0) >> 4),
        innerFEC: data[10] & 0x0f
    }),
    component_descriptor: (desc, data) => ({
        streamContentExt: (data[0] & 0xf0) >> 4,
        streamContent: data[0] & 0x0f,
        type: data[1],
        tag: data[2],
        languageCode: iconv.decode(data.slice(3, 6), 'ISO-8859-1'),
        text: stringify(data.slice(6, data.length))
    }),
    content_descriptor: (desc, d) => split(d, 0, 2, (data, i) => ({
        levelCombined: data[0],
        level1: (data[0] & 0xf0) >> 4,
        level2: data[0] & 0x0f,
        userByte: data[1]
    })),
    country_availability_descriptor: (desc, d) => ({
        availaiityFlag: d[0] & 0x80 !== 0,
        countryCodes: split(d, 1, 3, (data, i) => iconv.decode(data.slice(i, i + 3)), 'ISO-8859-1')
    }),
    enhanced_AC3_descriptor: (desc, data) => {
        const result = {
            hasComponentType: (data[0] & 0x80) !== 0,
            hasBsid: (data[0] & 0x40) !== 0,
            hasMainId: (data[0] & 0x20) !== 0,
            hasAsvc: (data[0] & 0x10) !== 0,
            hasMixInfo: (data[1] & 0x08) !== 0,
            hasSubstream1: (data[1] & 0x04) !== 0,
            hasSubstream2: (data[1] & 0x02) !== 0,
            hasSubstream3: (data[1] & 0x01) !== 0
        };

        let start = 1;
        if (result.hasComponentType) {
            result.componentType = data[start];
            start++;
        }
        if (result.hasBsid) {
            result.bsid = data[start];
            start++;
        }
        if (result.hasMainId) {
            result.mainid = data[start];
            start++;
        }
        if (result.hasAsvc) {
            result.asvc = data[start];
            start++;
        }
        if (result.hasSubstream1) {
            result.substream1 = data[start];
            start++;
        }
        if (result.hasSubstream2) {
            result.substream2 = data[start];
            start++;
        }
        if (result.hasSubstream3) {
            result.substream3 = data[start];
            start++;
        }
        result.additionalInfo = data.slice(start, data.length);
        return result;
    },
    frequency_list_descriptor: (desc, d) => ({
        codingType: d[0] & 0x3,
        frequencies: split(d, 1, 4, (data, i) => data[i] << 24 | data[i + 1] << 16 | data[i + 2] << 8 | data[i +3])
    }),
    ISO_639_language_descriptor: (desc, d) => split(d, 0, 4, (data, i) => ({
        languageCode: iconv.decode(Buffer.from(data.slice(i, i + 3)), 'ISO-8859-1'),
        audioType: data[i + 3]
    })),
    maximum_bitrate_descriptor: (desc, data) => ({
        maximumBitrate: (data[0] & 0xc0) << 16 | data[1] << 8 | data[2]
    }),
    network_name_descriptor: (desc, data) => ({
        raw: data,
        name: stringify(data)
    }),
    NVOD_reference_descriptor: (desc, d) => split(d, 0, 6, (data, i) => ({
        transportStreamId: data[i] << 8 | data[i + 1],
        originalNetworkId: data[i + 2] << 8 | data[i + 3],
        serviceId: data[i + 4] << 8 | data[i + 5],
    })),
    parental_rating_descriptor: (desc, d) => split(d, 0, 4, (data, i) => ({
        countryCode: iconv.decode(data.slice(i, i + 3), 'ISO-8859-1'),
        rating: data[i + 3]
    })),
    registration_descriptor: (desc, d) => ({
        formatIdentifier: d[0] << 24 | d[1] << 16 | d[2] << 8 | d[3],
        additionalIdentification: d.slice(3)
    }),
    service_list_descriptor: (desc, d) => split(d, 0, 3, (data, i) => ({
        id: data[i] << 8 | data[i + 1],
        type: data[i + 2]
    })),
    smoothing_buffer_descriptor: (desc, data) => ({
        sbLeakRate: (data[0] & 0xc0) << 16 | data[1] << 8 | data[2],
        sbSize: (data[3] & 0xc0) << 16 | data[4] << 8 | data[5],
    }),
    stream_identifier_descriptor: (desc, data) => ({
        componentTag: data[0]
    }),
    subtitling_descriptor: (desc, d) => split(d, 0, 8, (data, i) => ({
        languageCode: iconv.decode(Buffer.from(data.slice(i, i + 3)), 'ISO-8859-1'),
        type: data[i + 3],
        compositionPageId: data[i + 4] << 8 | data[i + 5],
        ancillaryPageId: data[i + 6] << 8 | data[i + 7]
    })),
    system_clock_descriptor: (desc, data) => ({
        isExternalClockReference: (data[0] & 0x80) !== 0,
        clockAccuracyInteger: data[0] & 0x3f,
        clockAccuracyExponent: (data[1] & 0xe0) >> 5
    }),
    teletext_descriptor: (desc, d) => split(d, 0, 5, (data, i) => ({
        languageCode: iconv.decode(Buffer.from(data.slice(i, i + 3)), 'ISO-8859-1'),
        type: (data[i + 3] & 0xf8) >> 3,
        magazineNumber: data[i + 3] & 0x07,
        pageNumber: data[i + 4]
    }))
};

export default class ParserDescriptor extends Parser {
    constructor() {
        super('Descriptor');
    }

    parse(descriptor, ...args) {
        // if (args.length <= 0 || args[0] !== 'PMT') {
        //     return;
        // }

        // Validate descriptor
        if (!descriptor instanceof PSIDescriptor) {
            throw new ParseError(`Data should be an instance of PSIDescriptor`);
        }

        // Parse descriptor
        const parser = descriptors[DESCRIPTORS[descriptor.tag]];
        if (parser) {
            descriptor.parsedData = parser(descriptor, descriptor.data);
            console.log('parsed:', toHexByte(descriptor.tag), DESCRIPTORS[descriptor.tag], descriptor.parsedData, ...args);
        } else {
            if (DESCRIPTORS[descriptor.tag]) {
                console.warn(`No descriptor parser for: ${DESCRIPTORS[descriptor.tag]}`);
            } else {
                if (!descriptor.tag) {
                    console.warn(`Descriptor has no tag`, descriptor);
                } else {
                    console.warn(`No descriptor entry for: ${toHexByte(descriptor.tag)}`);
                }
            }
        }
    }
};
