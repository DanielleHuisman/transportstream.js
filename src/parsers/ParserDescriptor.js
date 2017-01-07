import {DESCRIPTORS} from '../constants';
import {ParseError} from '../errors';
import {PSIDescriptor} from '../packets';
import {toHexByte} from '../util';
import Parser from './Parser';

// TODO: use the proper encoding
const stringify = (data) => data.map((char) => String.fromCharCode(char)).join('');

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
    component_descriptor: (desc, data) => ({
        streamContentExt: (data[0] & 0xf0) >> 4,
        streamContent: data[0] & 0x0f,
        type: data[1],
        tag: data[2],
        languageCode: stringify(data.slice(3, 6)),
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
        countryCodes: split(d, 1, 3, (data, i) => stringify(data.slice(i, i + 3)))
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
    network_name_descriptor: (desc, data) => ({
        name: stringify(data)
    }),
    NVOD_reference_descriptor: (desc, d) => split(d, 0, 6, (data, i) => ({
        transportStreamId: data[i] << 8 | data[i + 1],
        originalNetworkId: data[i + 2] << 8 | data[i + 3],
        serviceId: data[i + 4] << 8 | data[i + 5],
    })),
    parental_rating_descriptor: (desc, d) => split(d, 0, 4, (data, i) => ({
        countryCode: stringify(data.slice(i, i + 3)),
        rating: data[i + 3]
    })),
    service_list_descriptor: (desc, d) => split(d, 0, 3, (data, i) => ({
        id: data[i] << 8 | data[i + 1],
        type: data[i + 2]
    })),
    stream_identifier_descriptor: (desc, data) => ({
        componentTag: data[0]
    })
};

export default class ParserDescriptor extends Parser {
    constructor() {
        super('Descriptor');
    }

    parse(descriptor) {
        // Validate descriptor
        if (!descriptor instanceof PSIDescriptor) {
            throw new ParseError(`Data should be an instance of PSIDescriptor`);
        }

        // Parse descriptor
        const parser = descriptors[DESCRIPTORS[descriptor.tag]];
        if (parser) {
            descriptor.parsedData = parser(descriptor, descriptor.data);
            console.log('parsed:', DESCRIPTORS[descriptor.tag], descriptor.parsedData);
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
