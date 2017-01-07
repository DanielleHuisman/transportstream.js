// Reference: https://www.dvb.org/resources/public/standards/a38_dvb-si_specification.pdf

// Maps PSI table descriptions to table type
export const TABLE_TYPES = {
    program_association_section: 'PAT',
    conditional_access_section: 'CAT',
    program_map_section: 'PMT',
    transport_stream_description_section: 'TSDT',
    network_information_section: 'NIT',
    service_description_section: 'SDT',
    bouquet_association_section: 'BAT',
    event_information_section: 'EIT',
    time_date_section: 'TDT',
    running_status_section: 'RST',
    stuffing_section: 'ST',
    time_offset_section: 'TOT',
    content_identifier_section: 'CIT', // TS 102 323
    resolution_notification_section: 'RNT', // TS 102 323
    discontinuity_information_section: 'DIT',
    selection_information_section: 'SIT'
};

// Maps PSI table ID to table description
export const TABLE_DESCRIPTIONS = {
    0x00: ['program_association_section'],
    0x01: ['conditional_access_section'],
    0x02: ['program_map_section'],
    0x03: ['transport_stream_description_section'],
    // 0x04 - 0x3F: Reserved
    0x40: ['network_information_section', 'actual_network'],
    0x41: ['network_information_section', 'other_network'],
    0x42: ['service_description_section', 'actual_transport_stream'],
    // 0x43 - 0x45: Reserved
    0x46: ['service_description_section', 'other_transport_stream'],
    // 0x47 - 0x49: Reserved
    0x4A: ['bouquet_association_section'],
    // 0x4B - 0x4D: Reserved
    0x4E: ['event_information_section', 'actual_transport_stream', 'present/following'],
    0x4F: ['event_information_section', 'other_transport_stream', 'present/following'],
    // 0x50 - 0x6F: See below for fill loop
    0x70: ['time_date_section'],
    0x71: ['running_status_section'],
    0x72: ['stuffing_section'],
    0x73: ['time_offset_section'],
    0x74: ['application_information_section'], // TS 102 812
    0x75: ['container_section'], // TS 102 323
    0x76: ['related_content_section'], // TS 102 323
    0x77: ['content_identifier_section'], // TS 102 323
    0x78: ['mpe-fec_section'], // EN 301 192
    0x79: ['resolution_notification_section'], // TS 102 323
    0x7A: ['mpe-ifec_section'], // TS 102 772
    // 0x7B - 0x7D: Reserved
    0x7E: ['discontinuity_information_section'],
    0x7F: ['selection_information_section'],
    // 0x80 - 0xFE: User defined
    // 0xFF: Reserved
};

// Fill 0x50 to 0x5F
for (let i = 0x50; i <= 0x5f; i++) {
    TABLE_DESCRIPTIONS[i] = ['event_information_section', 'actual_transport_stream', 'schedule'];
}

// Fill 0x60 to 0x6F
for (let i = 0x60; i <= 0x6F; i++) {
    TABLE_DESCRIPTIONS[i] = ['event_information_section', 'other_transport_stream', 'schedule'];
}

// Generate table identifiers from descriptions and types
const TABLE_IDENTIFIERS = {};
for (const [key, value] of TABLE_DESCRIPTIONS) {
    TABLE_IDENTIFIERS[key] = TABLE_TYPES[value[0]];
}
export {TABLE_IDENTIFIERS};
