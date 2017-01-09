import {STREAM_GROUPS, DESCRIPTOR_GROUPS} from '../constants';
import Controller from './Controller';

export default class ControllerStream extends Controller {
    controllerTS = null;

    _programs = {};
    _cache = {};

    constructor(controllerTS) {
        super('stream');
        this.controllerTS = controllerTS;
    }

    start() {
        this.controllerTS.on('pat', this.handlePATUpdate);
    }

    getPrograms() {
        return this._programs;
    }

    getProgram(pid) {
        return this._programs[pid];
    }

    handlePATUpdate = (programMapTables, updates) => {
        for (const pid of updates) {
            const stream = this.controllerTS.getStream(pid);
            stream.on('readable', this.readStream.bind(this, pid, stream));
            this.controllerTS.enableStream(pid);
        }
    }

    readStream = (pid, stream) => {
        let packet = null;

        // Read all available packets
        while ((packet = stream.read(1)) !== null) {
            try {
                this.handlePMT(pid, packet);
            } catch (err) {
                console.error(err);
            }
        }
    }

    handlePMT(pid, packet) {
        // Check if the PMT is currently active and not a preview of the next PMT
        if (!packet.parent.isCurrent) {
            return;
        }

        // Check if the PMT wasn't already processed
        if (this._cache[packet.pcrPID] === packet.parent.versionNumber) {
            return;
        }

        // Update the PMT cache
        this._cache[packet.pcrPID] = packet.parent.versionNumber;

        // Create or clear the program for the new version of the PMT
        const program = {
            id: packet.pcrPID,
            descriptors: packet.programDescriptors,
            video: {},
            audio: {},
            subtitles: {},
            teletext: {},
            other: {}
        };

        // Loop over the program's streams to identify certain groups
        for (const stream of packet.streams) {
            let group = 'other';

            for (const [name, list] of Object.entries(STREAM_GROUPS)) {
                if (list.indexOf(stream.type) !== -1) {
                    group = name;
                }
            }

            for (const descriptor of stream.descriptors) {
                for (const [name, list] of Object.entries(DESCRIPTOR_GROUPS)) {
                    if (list.indexOf(descriptor.tag) !== -1) {
                        group = name;
                    }
                }
            }

            // Register the stream with this program
            program[group][stream.pid] = stream;
        }

        // Check if the program is new before adding it to the list
        const isNew = !this._programs[packet.pcrPID];
        this._programs[packet.pcrPID] = program;

        // Emit add/update event
        this.emit(isNew ? 'program-added' : 'program-updated', program);
    }
};
