// See: ETSI EN 300 743

export const SUBTITLE_SEGMENTS = {
    0x10: 'page_composition_segment',
    0x11: 'region_composition_segment',
    0x12: 'CLUT_definition_segment',
    0x13: 'object_data_segment',
    0x14: 'display_definition_segment',
    // 0x40 - 0x7F: Reserved
    0x80: 'end_of_display_set_segment',
    // 0x81 - 0xEF: Private data
    0xFF: 'stuffing_segment'
};
