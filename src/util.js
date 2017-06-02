export const mergeUint8Arrays = (array1, array2) => {
    const buffer = new Uint8Array(array1.length + array2.length);
    buffer.set(array1, 0);
    buffer.set(array2, array1.length);
    return buffer;
};

export const toHex = (input, length = -1) => {
    const str = input.toString(16).toUpperCase();
    if (length >= 0) {
        // return '0x' + str.padStart(length, '0');
    }
    return '0x' + str;
};

export const toHexByte = (byte) => {
    return `0x${byte < 16 ? '0' : ''}${byte.toString(16).toUpperCase()}`;
};

export const stringifyDvb = (data) => {
    if (data[0] == 0xE0 && data[1] >= 0x80 && data[1] <= 0x9F) {
        // TODO: two byte control codes
    } else if (data[0] >= 0x80 && data[0] <= 0x9F) {
        // TODO: one byte control codes
    }

    // TODO: default encoding is ISO/IEC 6937
    let result = '';
    data.forEach((value) => {
        result += String.fromCharCode(value);
    });
    return result;
};

export const _parseDate = (data, index) => {
    // Parse date
    const mjd = data[index] << 8 | data[index + 1];

    // Convert Modified Julian Date format to UTC
    const jd = mjd + 2400000.5;
    let jdi = Math.floor(jd);
    let jdf = jd - jdi + 0.5;
    if (jdf >= 1.0) {
        jdf = jdf - 1.0;
        jdi = jdi + 1;
    }
    let l = jdi + 68569;
    const n = Math.floor(4 * l / 146097);
    l = Math.floor(l) - Math.floor((146097 * n + 3) / 4);
    let years = Math.floor(4000 * (l + 1) / 1461001);
    l -= Math.floor(1461 * years / 4) - 31;
    let months = Math.floor(80 * l / 2447);
    const days = l - Math.floor(2447 * months / 80);
    l = Math.floor(months / 11);
    months = Math.floor(months + 2 - 12 * l);
    years = Math.floor(100 * (n - 49) + years + l);

    return {years, months, days};
};

export const parseDate = (data, index) => {
    // Parse date
    const {years, months, days} = _parseDate(data, index);

    return new Date(`${years}-${months}-${days} 00:00:00 UTC`);
};

export const parseDatetime = (data, index) => {
    // Parse date
    const {years, months, days} = _parseDate(data, index);

    // Parse time
    const hours = ((data[index + 2] & 0xf0) >> 4) * 10 + (data[index + 2] & 0x0f);
    const minutes = ((data[index + 3] & 0xf0) >> 4) * 10 + (data[index + 3] & 0x0f);
    const seconds = ((data[index + 4] & 0xf0) >> 4) * 10 + (data[index + 4] & 0x0f);

    return new Date(`${years}-${months}-${days} ${hours}:${minutes}:${seconds} UTC`);
};

export const parseBCD = (data, index) => {
    return `${data[index] & 0xc}${data[index] & 0x3}:${data[index + 1] & 0xc}${data[index + 1] & 0x3}`;
};

export const parseBCDSeconds = (data, index) => {
    return 60 * (((data[index] & 0xc) * 10 + (data[index] & 0x3)) * 60 + (data[index + 1] & 0xc) * 10 + (data[index + 1] & 0x3));
};

export const parseDatetimeBCD = (data, index) => {
    // Parse date
    const {years, months, days} = _parseDate(data, index);

    // Parse time
    const hours = `${data[index] & 0xc}${data[index] & 0x3}`;
    const minutes = `${data[index + 1] & 0xc}${data[index + 1] & 0x3}`;
    const seconds = `${data[index + 2] & 0xc}${data[index + 2] & 0x3}`;

    return new Date(`${years}-${months}-${days} ${hours}:${minutes}:${seconds} UTC`);
};
