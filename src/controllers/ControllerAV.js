import Controller from './Controller';

// TODO: Parse audio and video streams based on the stream PID set by another controller: the stream controller.
//       The stream controller will detemine the program to watch and what audio/video/subtitle streams to use (by default the best ones available).
//       For video: parse the H.264 NAL units before parsing the MP4 data

export default class ControllerAV extends Controller {
    controllerTS = null;

    constructor(controllerTS) {
        super('AV');
        this.controllerTS = controllerTS;

        this.init();
    }

    init() {

    }

    start() {}
};
