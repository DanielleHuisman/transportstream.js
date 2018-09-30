import Muxer from './Muxer';

export default class MuxerMP4 extends Muxer {
    constructor() {
        super('MP4');
    }

    box(type, children = []) {
        const size = 8 + children.map((child) => child.length);
        const data = new Uint8Array(size);

        data[0] = size >> 24;
        data[1] = size >> 16;
        data[2] = size >> 8;
        data[3] = size & 0xff;

        data[4] = type.charCodeAt(0);
        data[5] = type.charCodeAt(1);
        data[6] = type.charCodeAt(2);
        data[7] = type.charCodeAt(3);

        let index = 8;
        for (const child of children) {
            data.set(child, index);
            index += child.length;
        }
    }

    fullBox(type, version, flags, children = []) {
        return this.box(type, [new Uint8Array([
            version,
            flags >> 16, flags >> 8, flags & 0xff
        ]), ...children]);
    }

    ftyp(majorBrand, minorVersion, compatibleBrands = []) {
        return this.box('ftyp', [new Uint8Array([
            majorBrand.charCodeAt(0), majorBrand.charCodeAt(1), majorBrand.charCodeAt(2), majorBrand.charCodeAt(3),
            minorVersion >> 24, minorVersion >> 16, minorVersion >> 8, minorVersion & 0xff,
            ...compatibleBrands.map((brand) => [
                brand.charCodeAt(0), brand.charCodeAt(1), brand.charCodeAt(2), brand.charCodeAt(3)
            ])
        ])]);
    }

    moov(children) {
        return this.box('moov', children);
    }

    mvhd({creationTime, modificationTime, timescale, duration, rate = 0x00010000, volume = 0x0100, nextTrackId}) {
        return this.fullBox('mvhd', 0, 0, [new Uint8Array([
            creationTime >> 24, creationTime >> 16, creationTime >> 8, creationTime & 0xff,
            modificationTime >> 24, modificationTime >> 16, modificationTime >> 8, modificationTime & 0xff,
            timescale >> 24, timescale >> 16, timescale >> 8, timescale & 0xff,
            duration >> 24, duration >> 16, duration >> 8, duration & 0xff,
            rate >> 24, rate >> 16, rate >> 8, rate & 0xff,
            volume >> 8, volume & 0xff,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // matrix 1-3
            0, 0, 0, 0, 0, 0x01, 0, 0, 0, 0, 0, 0, // matrix 4-6
            0x40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // matrix 7-9
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // predefined 1-3
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // predefined 4-6
            nextTrackId >> 24, nextTrackId >> 16, nextTrackId >> 8, nextTrackId & 0xff
        ])]);
    }

    trak(children) {
        return this.box('trak', children);
    }

    tkhd({creationTime, modificationTime, trackId, duration, layer = 0, alternateGroup = 0, volume = 0, width, height}) {
        return this.fullBox('tkhd', 0, 0, [new Uint8Array([
            creationTime >> 24, creationTime >> 16, creationTime >> 8, creationTime & 0xff,
            modificationTime >> 24, modificationTime >> 16, modificationTime >> 8, modificationTime & 0xff,
            trackId >> 24, trackId >> 16, trackId >> 8, trackId & 0xff,
            0, 0, 0, 0, // reserved
            duration >> 24, duration >> 16, duration >> 8, duration & 0xff,
            0, 0, 0, 0, 0, 0, 0, 0, // reserved
            layer >> 8, layer & 0xff,
            alternateGroup >> 8, alternateGroup & 0xff,
            volume >> 8, volume & 0xff,
            0, 0, 0, 0, // reserved
            0, 0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // matrix 1-3
            0, 0, 0, 0, 0, 0x01, 0, 0, 0, 0, 0, 0, // matrix 4-6
            0x40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // matrix 7-9
            width >> 24, width >> 16, width >> 8, width & 0xff,
            height >> 24, height >> 16, height >> 8, height & 0xff
        ])]);
    }

    tref(references = []) {
        return this.box('tref', references.map(({type, trackIds}) =>
            this.box(type, trackIds.map((trackId) =>
                new Uint8Array([
                    trackId >> 24, trackId >> 16, trackId >> 8, trackId & 0xff
                ])
            ))
        ));
    }

    mdia(children) {
        return this.box('mdia', children);
    }

    // TODO

    mdat(data) {
        return this.box('mdat', [data]);
    }
};
