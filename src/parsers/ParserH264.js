// import {PacketH264} from '../packets';
import Parser from './Parser';

export default class ParserH264 extends Parser {
    constructor() {
        super('H264');
    }

    parse(data) {
        // Initialize packet
        // const packet = new PacketH264(data);

        if (!(data[0] | data[1]) === 0x00 && (data[2] === 0x01 || (data[2] === 0x00 && data[+ 3] === 0x01))) {
            console.warn('PES doesn\'t directly start with NAL unit, overflow is currently not implemented, so things might break');
        }

        const units = [];

        let offset;
        let lastOffset = -1;
        for (offset = 0; offset < data.length - 3; offset++) {
            // Look for three or four byte start code (0x000001 or 0x00000001)
            if ((data[offset] | data[offset + 1]) === 0x00 && (data[offset + 2] === 0x01 || (data[offset + 2] === 0x00 && data[offset + 3] === 0x01))) {
                // Set data of the previous NAL unit
                if (lastOffset >= 0) {
                    units[units.length - 1].data = data.subarray(lastOffset, offset);
                }

                offset += data[offset + 2] === 0x00 ? 4 : 3;

                if ((data[offset] & 0x80) !== 0) {
                    console.warn('Zero bit is not zero');
                }

                const unit = {
                    refIdc: (data[offset] & 0x60) >> 5,
                    type: data[offset] & 0x1f
                };
                offset += 1;

                if (unit.type === 14 || unit.type === 20) {
                    if ((data[offset] & 0x80) !== 0) {
                        // TODO: SVC extension
                    } else {
                        // TODO: MVC extension
                    }
                    offset += 3;
                }

                lastOffset = offset;
                units.push(unit);
            }
        }

        // Set data of the previous NAL unit
        if (lastOffset >= 0) {
            units[units.length - 1].data = data.subarray(lastOffset, offset);
        }

        // Sanitize NAL unit data
        units.forEach((unit) => this._sanitizeNALUnitData(unit));

        // TODO; wrap them with class maybe?
        return units;
    }

    _sanitizeNALUnitData(unit) {
        const buffer = new Uint8Array(new ArrayBuffer(unit.data.length));
        let dataIndex = 0;

        let index = 0;

        let lastStop = index;
        while (index < unit.data.length) {
            if (index + 2 < unit.data.length && unit.data[index] === 0x00 && unit.data[index + 1] === 0x00 && unit.data[index + 2] === 0x03) {
                // Append data slice (minus 0x03)
                const slice = unit.data.subarray(lastStop, index + 2);
                buffer.set(slice, dataIndex);
                dataIndex += slice.length;

                index += 3;
                lastStop = index;
            } else {
                index++;
            }
        }
        // TODO: PES payload overflow?

        // Append last data slice
        const slice = unit.data.subarray(lastStop, unit.data.length);
        buffer.set(slice, dataIndex);
        dataIndex += slice.length;

        // Finalize NAL unit
        unit.data = buffer.slice(0, unit.dataLength);
    }
};
