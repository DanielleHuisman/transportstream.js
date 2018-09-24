import iconv from 'iconv-lite';

import {DESCRIPTORS} from '../constants';
import {ParseError} from '../errors';
import {PSIDescriptor} from '../packets';
import {stringifyDvb, parseBCD, parseBCDSeconds, parseDatetimeBCD} from '../util';
import Parser from './Parser';

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
    CA_descriptor: (desc, data) => ({
        systemId: data[0] << 8 | data[1],
        pid: (data[2] & 0x1f) << 8 | data[3],
        privateData: data.slice(3)
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
        text: stringifyDvb(data.slice(6, data.length))
    }),
    content_descriptor: (desc, d) => split(d, 0, 2, (data, i) => ({
        levelCombined: data[0],
        level1: (data[0] & 0xf0) >> 4,
        level2: data[0] & 0x0f,
        userByte: data[1]
    })),
    content_identifier_descriptor: (desc, data) => {
        const finalData = [];

        let index = 0;
        while (index < data.length) {
            const crid = {
                type: (data[index] & 0xfc) >> 2,
                location: data[index] & 0x03
            };
            index += 2;

            if (crid.location === 0x00) {
                crid.length = data[index];
                crid.bytes = data.slice(index + 1, index + 1 + crid.length);
                index += 1 + crid.length;
            } else if (crid.location === 0x01) {
                crid.ref = data[index] << 8 | data[index + 1];
                index += 2;
            }
        }

        return finalData;
    },
    country_availability_descriptor: (desc, d) => ({
        availaiityFlag: d[0] & 0x80 !== 0,
        countryCodes: split(d, 1, 3, (data, i) => iconv.decode(data.slice(i, i + 3)), 'ISO-8859-1')
    }),
    data_broadcast_id_descriptor: (desc, data) => ({
        dataBroadcastId: data[0] << 8 | data[1],
        idSelectorBytes: data.slice(2)
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
    extended_event_descriptor: (desc, data) => {
        const finalData = {
            number: (data[0] & 0xf0) >> 4,
            lastNumber: data[0] & 0x0f,
            languageCode: iconv.decode(Buffer.from(data.slice(1, 4)), 'ISO-8859-1'),
            text: stringifyDvb(data.slice(6 + data[4], data.length)),
            itemLength: data[4],
            items: []
        };
        let index = 5;
        while (index < finalData.itemLength) {
            const item = {};
            item.description = stringifyDvb(data.slice(index + 1, index + 1 + data[index]));
            index += data[index];
            item.text = stringifyDvb(data.slice(index + 1, index + 1 + data[index]));
            index += data[index];

            finalData.items.push(item);
        }

        return finalData;
    },
    frequency_list_descriptor: (desc, d) => ({
        codingType: d[0] & 0x3,
        frequencies: split(d, 1, 4, (data, i) => data[i] << 24 | data[i + 1] << 16 | data[i + 2] << 8 | data[i +3])
    }),
    ISO_639_language_descriptor: (desc, d) => split(d, 0, 4, (data, i) => ({
        languageCode: iconv.decode(Buffer.from(data.slice(i, i + 3)), 'ISO-8859-1'),
        audioType: data[i + 3]
    })),
    linkage_descriptor: (desc, data) => {
        const result = {
            streamId: data[0] << 8 | data[1],
            originalNetworkId: data[2] << 8 | data[3],
            serviceId: data[4] << 8 | data[5],
            linkageType: data[6]
        };
        let start = 7;

        if (result.linkageType === 0x80) {
            result.handOverType = (data[start] & 0xf0) >> 4;
            result.originType = data[start] & 0x01;
            start++;

            if (result.handOverType >= 0x01 && result.handOverType <= 0x03) {
                result.networkId = data[start] << 8 | data[start + 1];
                start += 2;
            }

            if (result.originType === 0x00) {
                result.initialServiceId = data[start] << 8 | data[start + 1];
                start += 2;
            }
        } else if (result.linkageType === 0x0D) {
            result.targetEventId = data[start] << 8 | data[start + 1];
            result.isTargetListed = (data[start + 2] & 0x80) !== 0;
            result.isEventSimulcast = (data[start + 2] & 0x40) !== 0;
            start += 3;
        } else if (result.linkageType >= 0x0E && result.linkageType <= 0x1F) {
            result.loopLength = data[start];
            start++;
            let index = 0;

            while (index < result.loopLength) {
                result.targetEventId = data[start + index] << 8 | data[start + index + 1];
                result.isTargetListed = (data[start + index+ 2] & 0x80) !== 0;
                result.isEventSimulcast = (data[start + index + 2] & 0x40) !== 0;
                result.linkType = (data[start + index + 2] & 0x30) >> 4;
                result.targetIdType = (data[start + index + 2] & 0x0c) >> 2;
                result.hasOriginalNetworkId = (data[start + index+ 2] & 0x02) !== 0;
                result.hasServiceId = (data[start + index+ 2] & 0x02) !== 0;
                index += 3;

                if (result.targetIdType === 3) {
                    result.userDefinedId = data[start + index] << 8 | data[start + index + 1];
                    index += 2;
                } else {
                    if (result.targetIdType === 1) {
                        result.targetStreamId = data[start + index] << 8 | data[start + index + 1];
                        index += 2;
                    }
                    if (result.hasOriginalNetworkId) {
                        result.targetOriginalNetworkId = data[start + index] << 8 | data[start + index + 1];
                        index += 2;
                    }
                    if (result.hasServiceId) {
                        result.targetServiceId = data[start + index] << 8 | data[start + index + 1];
                        index += 2;
                    }
                }
            }

            start += result.loopLength;
        }

        result.privateData = data.slice(start);

        return result;
    },
    local_time_offset_descriptor: (desc, d) => split(d, 0, 13, (data, i) => ({
        countryCode: iconv.decode(data.slice(i, i + 3), 'ISO-8859-1'),
        countryRegionId: data[i + 3] & 0xfc,
        offsetPolarity: data[i + 3] & 0x01,
        offset: parseBCD(data, i + 4),
        offsetSeconds: parseBCDSeconds(data, i + 4),
        timeOfChange: parseDatetimeBCD(data, i + 6),
        nextOffset: parseBCD(data, i + 11),
        nextOffsetSeconds: parseBCDSeconds(data, i + 11)
    })),
    maximum_bitrate_descriptor: (desc, data) => ({
        maximumBitrate: (data[0] & 0x30) << 16 | data[1] << 8 | data[2]
    }),
    multiplex_buffer_utilization_descriptor: (desc, data) => ({
        isBoundValid: (data[0] & 0x80) !== 0,
        offsetLowerBound: (data[0] & 0x7f) << 8 | data[1],
        offsetUpperBound: (data[2] & 0x7f) << 8 | data[3]
    }),
    network_name_descriptor: (desc, data) => ({
        raw: data,
        name: stringifyDvb(data)
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
    private_data_specifier_descriptor: (desc, data) => ({
        specifier: data[0] << 24 | data[1] << 16 | data[2] << 8 | data[3]
    }),
    registration_descriptor: (desc, d) => ({
        formatIdentifier: d[0] << 24 | d[1] << 16 | d[2] << 8 | d[3],
        additionalIdentification: d.slice(3)
    }),
    related_content_descriptor: () => ({}),
    service_descriptor: (desc, data) => ({
        type: data[0],
        provider: stringifyDvb(data.slice(2, 2 + data[1])),
        name: stringifyDvb(data.slice(3 + data[1], data.length))
    }),
    service_list_descriptor: (desc, d) => split(d, 0, 3, (data, i) => ({
        id: data[i] << 8 | data[i + 1],
        type: data[i + 2]
    })),
    short_event_descriptor: (desc, data) => ({
        languageCode: iconv.decode(Buffer.from(data.slice(0, 3)), 'ISO-8859-1'),
        eventName: stringifyDvb(data.slice(4, 4 + data[3])),
        text: stringifyDvb(data.slice(5 + data[3], data.length))
    }),
    smoothing_buffer_descriptor: (desc, data) => ({
        sbLeakRate: (data[0] & 0x30) << 16 | data[1] << 8 | data[2],
        sbSize: (data[3] & 0x30) << 16 | data[4] << 8 | data[5],
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
        // Validate descriptor
        if (!descriptor instanceof PSIDescriptor) {
            throw new ParseError(`Data should be an instance of PSIDescriptor`);
        }

        // Parse descriptor
        const parser = descriptors[DESCRIPTORS[descriptor.tag]];
        if (parser) {
            descriptor.name = DESCRIPTORS[descriptor.tag];
            descriptor.parsedData = parser(descriptor, descriptor.data);
            // console.log('parsed:', toHexByte(descriptor.tag), DESCRIPTORS[descriptor.tag], descriptor.parsedData, ...args);
        } else {
            if (DESCRIPTORS[descriptor.tag]) {
                console.warn(`No descriptor parser for: ${DESCRIPTORS[descriptor.tag]}`);
            } else {
                if (!descriptor.tag) {
                    console.warn(`Descriptor has no tag`, descriptor);
                } else {
                    // console.warn(`No descriptor entry for: ${toHexByte(descriptor.tag)}`);
                }
            }
        }
    }
};
