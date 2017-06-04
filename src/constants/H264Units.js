// See: ITU-T REC H.264

export const H264_UNITS = {
    1: 'slice_layer_without_partitioning',
    2: 'slice_data_partition_a_layer',
    3: 'slice_data_partition_b_layer',
    4: 'slice_data_partition_c_layer',
    5: 'slice_layer_without_partitioning',
    6: 'sei',
    7: 'seq_parameter_set',
    8: 'pic_parameter_set',
    9: 'access_unit_delimter',
    10: 'end_of_seq',
    11: 'end_of_stream',
    12: 'filter_data',
    13: 'seq_parameter_set_extension',
    14: 'prefix_nal_unit',
    15: 'subset_seq_parameter_set',
    // 16 - 18: Reserved
    19: 'slice_layer_without_partitioning',
    20: 'slice_layer_extension'
    // 21 - 23: Reserved
    // 24 - 31: Unspecified
};
