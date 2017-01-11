import Packet from './Packet';

export class SubtitleSegment {
    type = 0;
    pageId = 0;
    length = 0;
    data = null;
    parsedData = null;
};

export default class PacketSubtitles extends Packet {
    identifier = 0;
    streamId = 0;
    segments = [];

    constructor(data) {
        super(data);
    }
};
