import Controller from './Controller';

// TODO: The stream controller will determine the program to watch and what audio/video/subtitle streams to use (by default the best ones available).

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
        // Check if the program exists
        if (!this.controllerPMT.hasProgram(pid)) {
            throw new Error(`Unknown program "${pid}"`);
        }

        // Change the program
        this._program = pid;

        // Reset the streams
        this._streams = {
            video: -1,
            audio: -1,
            subtitles: -1,
            teletext: -1
        };

        // Emit update event
        this.emit('program-updated', this._program);

        // Change the default streams;
        this.handleProgramSwitch();
    }

    getStreams() {
        return this._streams;
    }

    getStream(group) {
        return this._streams[group];
    }

    setStream(group, pid) {
        const program = this.controllerPMT.getProgram(this._program);

        // Check if the stream exists
        if (!program || !program[group] || !program[group][pid]) {
            throw new Error(`Unknown stream "${pid}" for program "${this._program}" in group "${group}"`);
        }

        // Change the stream
        this._streams[group] = pid;

        // Emit update event
        this.emit('streams-updated', this._streams, [group]);
    }

    handleProgramSwitch() {
        // Look up the program and define default streams and scores
        const program = this.controllerPMT.getProgram(this._program);
        const streams = {
            video: -1,
            audio: -1,
            subtitles: -1,
            teletext: -1
        };
        const scores = {
            video: -1,
            audio: -1,
            subtitles: -1,
            teletext: -1
        };

        // Determine best stream per group
        for (const group of Object.keys(streams)) {
            for (const stream of Object.values(program[group])) {
                let score = 0;

                switch (group) {
                    case 'video': {
                        // Generally speaking better video sources have a higher stream type (fine for now)
                        score = stream.type;
                        break;
                    }
                    case 'audio': {
                        // Generally speaking better video sources have a higher stream type (fine for now)
                        // score = stream.type === 6 ? 0 : stream.type; // TODO: remove skipping of AC3 track
                        score = stream.type;

                        for (const descriptor of stream.descriptors) {
                            if (descriptor.name === 'ISO_639_language_descriptor') {
                                // Check if it's the main audio source
                                if (descriptor.parsedData.audioType === 0) {
                                    // Increase the score while maintaining the quality offset
                                    score *= 100;
                                }
                            }
                        }
                    }
                    case 'subtitles': {
                        // Loop over all subtitles (can be spread of multiple descriptors)
                        for (const descriptor of stream.descriptors) {
                            if (descriptor.name === 'subtitling_descriptor') {
                                for (const subtitle of descriptor.parsedData) {
                                    // Check if these are normal subtitles (not for the hard of hearing)
                                    if (subtitle.type >= 0x10 && subtitle.type <= 0x1F) {
                                        // There is no real difference between subtitles, apart from language.
                                        // However language information is not available at this time
                                        score = 1;
                                    }

                                    // TODO: remove this test
                                    score = subtitle.type;
                                }
                            }
                        }
                        break;
                    }
                    case 'teletext': {
                        // To my knowledge there is only one teletext stream per program, so there is no need to score the stream
                        break;
                    }
                    default: {
                        console.warn(`Invalid stream group "${group}"`);
                    }
                }

                // Check if this stream's score if higher, if so use it
                if (score > scores[group]) {
                    scores[group] = score;
                    streams[group] = {
                        pid: stream.pid,
                        type: stream.determinedType
                    };
                }
            }
        }

        // Check which streams were updated
        const updates = [];
        for (const group of Object.keys(streams)) {
            if (streams[group].pid !== this._streams[group].pid) {
                updates.push(group);
            }
        }

        // Update the streams
        this._streams = streams;

        // Emit update event
        this.emit('streams-updated', this._streams, updates);
    }
};
