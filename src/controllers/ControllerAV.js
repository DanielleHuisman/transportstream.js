import Controller from './Controller';

// TODO: Parse audio and video streams based on the stream PID set by another controller: the stream controller.
//       The stream controller will detemine the program to watch and what audio/video/subtitle streams to use (by default the best ones available).
//       For video: parse the H.264 NAL units before parsing the MP4 data

export default class ControllerAV extends Controller {
    controllerTS = null;
    _audioStreamId = -1
    _videoStreamId = -1

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

    setAudioStream(streamId) {
        // Remove the old packet listener
        if (this._audioStreamId >= 0) {
            this.removeListener(this._audioStreamId);
        }

        // Update the stream
        this._audioStreamId = streamId;

        // Add a new listener if the stream is available
        if (this.controllerTS.hasStream(this._audioStreamId)) {
            this.addListener(this._audioStreamId);
        }
    }

    setVideoStream(streamId) {
        // Remove the old packet listener
        if (this._videoStreamId >= 0) {
            this.removeListener(this._videoStreamId);
        }

        // Update the stream
        this._videoStreamId = streamId;

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
            // const packet = this.parserSubtitles.parse(packetPES.payload);
            // packet.parent = packetPES;

            // console.log('audio', packetPES);

            this.emit('audio', packetPES.payload.buffer);
        }
    }

    handleVideoPackets = () => {
        // const stream = this.controllerTS.getStream(this._videoStreamId);
        // let packetPES = null;
        //
        // while ((packetPES = stream.read(1)) !== null) {
        //     const packet = this.parserSubtitles.parse(packetPES.payload);
        //     packet.parent = packetPES;
        //
        //     console.log('video', packetPES);
        // }
    }
};
