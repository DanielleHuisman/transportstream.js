import Controller from './Controller';

// TODO: The stream controller will detemine the program to watch and what audio/video/subtitle streams to use (by default the best ones available).

export default class ControllerStream extends Controller {
    controllerTS = null;
    controllerPMT = null;

    _program = -1;
    _streams = {
        video: -1,
        audio: -1,
        subtitles: -1,
        teletext: -1
    };

    constructor(controllerTS, controllerPMT) {
        super('Stream');
        this.controllerTS = controllerTS;
        this.controllerPMT = controllerPMT;

        this.init();
    }

    init() {

    }

    start() {}

    getProgram() {
        return this._program;
    }

    setProgram(pid) {
        // TODO: check if program exists in PMT controller
        this._program = pid;
        // TODO: switch program, choose default streams, trigger event, etc.
    }

    getStreams() {
        return this._streams;
    }

    getStream(group) {
        return this._streams[group];
    }

    setStream(group, pid) {
        // TODO: check if stream exists in TS/PMT controller
        this._streams[group] = pid;
        // TODO: switch stream, trigger event, etc.
    }
};
