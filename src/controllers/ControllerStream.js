import Controller from './Controller';

export default class ControllerStream extends Controller {
    controllerTS = null;

    constructor(controllerTS) {
        super('stream');
        this.controllerTS = controllerTS;
    }

    start() {
        this.controllerTS.on('pat', this.handlePATUpdate);
    }

    handlePATUpdate = (programMapTables, updates) => {
        console.log('PAT updates:', updates, programMapTables);

        for (const pid of updates) {
            const stream = this.controllerTS.getStream(pid);
            stream.on('readable', this.readStream.bind(this, pid, stream));
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
        console.log(packet);
    }
};
