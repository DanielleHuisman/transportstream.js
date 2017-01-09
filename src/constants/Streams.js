export const STREAM_TYPES = {
    // 0x00: Reserved
    0x01: 'ISO/IEC 11172-2 Video',
    0x02: 'ITU-T Rec. H.262 | ISO/IEC 13818-2 Video or ISO/IEC 11172-2 constrained parameter video stream',
    0x03: 'ISO/IEC 11172-3 Audio',
    0x04: 'ISO/IEC 13818-3 Audio',
    0x05: 'ITU-T Rec. H.222.0 | ISO/IEC 13818-1 private_sections',
    0x06: 'ITU-T Rec. H.222.0 | ISO/IEC 13818-1 PES packets containing private data',
    0x07: 'ISO/IEC 13522 MHEG',
    0x08: 'ITU-T Rec. H.222.0 | ISO/IEC 13818-1 Annex A DSM-CC',
    0x09: 'ITU-T Rec. H.222.1',
    0x0A: 'ISO/IEC 13818-6 type A',
    0x0B: 'ISO/IEC 13818-6 type B',
    0x0C: 'ISO/IEC 13818-6 type C',
    0x0C: 'ISO/IEC 13818-6 type D',
    0x0E: 'ITU-T Rec. H.222.0 | ISO/IEC 13818-1 auxiliary',
    0x0F: 'ISO/IEC 13818-7 Audio with ADTS transport syntax',
    0x10: 'ISO/IEC 14496-2 Visual',
    0x11: 'ISO/IEC 14496-3 Audio with the LATM transport syntax as defined in ISO/IEC 14496-3',
    0x12: 'ISO/IEC 14496-1 SL-packetized stream or FlexMux stream carried in PES packets',
    0x13: 'ISO/IEC 14496-1 SL-packetized stream or FlexMux stream carried in ISO/IEC 14496_sections',
    0x14: 'ISO/IEC 13818-6 Synchronized Download Protocol',
    0x15: 'Metadata carried in PES packets',
    0x16: 'Metadata carried in metadata_sections',
    0x17: 'Metadata carried in ISO/IEC 13818-6 Data Carousel',
    0x18: 'Metadata carried in ISO/IEC 13818-6 Object Carousel',
    0x19: 'Metadata carried in ISO/IEC 13818-6 Synchronized Download Protocol',
    0x1A: 'IPMP stream (defined in ISO/IEC 13818-11, MPEG-2 IPMP)',
    0x1B: 'AVC video stream as defined in ITU-T Rec. H.264 | ISO/IEC 14496-10 Video',
    // 0x1C - 0x7E: Reserved for ITU-T Rec. H.222.0 and ISO/IEC 13818-1
    0x7F: 'IPMP stream'
    // 0x80 - 0xFF: User defined
};

export const STREAM_GROUPS = {
    video: [0x01, 0x02, 0x1B],
    audio: [0x03, 0x04, 0x0F, 0x11],
    subtitles: [],
    teletext: []
};
