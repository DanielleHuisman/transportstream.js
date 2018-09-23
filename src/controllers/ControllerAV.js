import {ParserH264} from '../parsers';
import Controller from './Controller';

export default class ControllerAV extends Controller {
    controllerTS = null;
    parserH264 = new ParserH264();
    _audioStreamId = -1;
    _audioStreamType = null;
    _videoStreamId = -1;
    _videoStreamType = null;

    constructor(controllerTS) {
        super('AV');
        this.controllerTS = controllerTS;

        this.init();
    }

    init() {

    }

    start() {}

    getAudioStream() {
        return this._audioStreamId;
    }

    getVideoStream() {
        return this._videoStreamId;
    }

    setAudioStream({pid: streamId, type: streamType}) {
        // Remove the old packet listener
        if (this._audioStreamId >= 0) {
            this.removeListener(this._audioStreamId);
        }

        // Update the stream
        this._audioStreamId = streamId;
        this._audioStreamType = streamType;

        // Add a new listener if the stream is available
        if (this.controllerTS.hasStream(this._audioStreamId)) {
            this.addListener(this._audioStreamId);
        }
    }

    setVideoStream({pid: streamId, type: streamType}) {
        // Remove the old packet listener
        if (this._videoStreamId >= 0) {
            this.removeListener(this._videoStreamId);
        }

        // Update the stream
        this._videoStreamId = streamId;
        this._videoStreamType = streamType;

        // Add a new listener if the stream is available
        if (this.controllerTS.hasStream(this._videoStreamId)) {
            this.addListener(this._videoStreamId);
        }
    }

    addListener(streamId) {
        this.controllerTS.enableStream(streamId);
        const stream = this.controllerTS.getStream(streamId);
        stream.on('readable', streamId === this._audioStreamId ? this.handleAudioPackets : this.handleVideoPackets);
    }

    removeListener(streamId) {
        this.controllerTS.disableStream(streamId);
        const stream = this.controllerTS.getStream(streamId);
        stream.off('readable', streamId === this._audioStreamId ? this.handleAudioPackets : this.handleVideoPackets);
    }

    handleAudioPackets = () => {
        const stream = this.controllerTS.getStream(this._audioStreamId);
        let packetPES = null;

        while ((packetPES = stream.read(1)) !== null) {
            switch (this._audioStreamType) {
                case 'AC3': {
                    // TODO: differentiate between stream types
                    // const packet = this.parserAC3.parse(packetPES.payload);

                    // console.log('audio', packetPES);

                    const data = packetPES.payload;
                    let offset;
                    for (offset = 0; offset < data.length - 1; offset++) {
                        if ((data[offset] === 0xff) && ((data[offset + 1] & 0xf0) === 0xf0)) {
                            break;
                        }
                    }

                    // console.log('start', offset);

                    // this.emit('audio', packetPES.payload.buffer);
                    break;
                }
                case 'MPEG-2 Part 3': {
                    // TODO

                    this.emit('audio', packetPES.payload.buffer);

                    break;
                }
                case 'MPEG-1 Part 3': {
                    // TODO
                    break;
                }
            }
        }
    }

    handleVideoPackets = () => {
        const stream = this.controllerTS.getStream(this._videoStreamId);
        let packetPES = null;

        while ((packetPES = stream.read(1)) !== null) {
            switch (this._videoStreamType) {
                case 'H.264': { // MPEG4-2
                    const units = this.parserH264.parse(packetPES.payload);

                    console.log('video', units);
                    break;
                }
                case 'H.262': { // MPEG2-2
                    // TODO
                    break;
                }
                case 'MPEG1-2': {
                    // TODO
                    break;
                }
            }
        }
    }
};
