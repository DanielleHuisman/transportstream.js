// Reference: https://www.dvb.org/resources/public/standards/a38_dvb-si_specification.pdf

export default {
    0: 'PAT',
    1: 'CAT',
    2: 'TSDT',
    // 3-15: Reserved for future use
    16: ['NIT', 'ST'],
    17: ['SDT', 'BAT', 'ST'],
    18: ['EIT', 'CIT', 'ST'],
    19: ['RST', 'ST'],
    20: ['TDT', 'TOT', 'ST'],
    21: 'NetworkSync',
    22: 'RNT',
    // 23-27: Reserved for future use
    28: 'InbandSignaling',
    29: 'Measurement',
    30: 'DIT',
    31: 'SIT',
    // 32-8190: May be assigned as needed to Program Map Tables (PMT), elementary streams and other data tables.
    8191: 'NULL'
};
