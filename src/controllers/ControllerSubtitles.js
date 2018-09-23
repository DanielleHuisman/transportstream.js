import {ParserSubtitles} from '../parsers';
import Controller from './Controller';

export default class ControllerSubtitles extends Controller {
    controllerTS = null;

    parserSubtitles = new ParserSubtitles();
    _streamId = -1;

    constructor(controllerTS) {
        super('Subtitles');
        this.controllerTS = controllerTS;

        this.init();
    }

    init() {
        this.controllerTS.on('pid', (pid) => {
            // Check if it's the stream we're looking for
            if (pid === this._streamId) {
                this.addListener();
            }
        });
    }

    start() {}

    getStream() {
        return this._streamId;
    }

    setStream(streamId) {
        // Remove the old packet listener
        if (this._streamId >= 0) {
            this.removeListener();
        }

        // Update the stream
        this._streamId = streamId;

        // Add a new listener if the stream is available
        if (this.controllerTS.hasStream(this._streamId)) {
            this.addListener();
        }
    }

    addListener() {
        this.controllerTS.enableStream(this._streamId);
        const stream = this.controllerTS.getStream(this._streamId);
        stream.on('readable', this.handlePackets);
    }

    removeListener() {
        this.controllerTS.disableStream(this._streamId);
        const stream = this.controllerTS.getStream(this._streamId);
        stream.off('readable', this.handlePackets);
    }

    handlePackets = () => {
        const stream = this.controllerTS.getStream(this._streamId);
        let packetPES = null;

        while ((packetPES = stream.read(1)) !== null) {
            const packet = this.parserSubtitles.parse(packetPES.payload);
            packet.parent = packetPES;

            this.emit('subtitles', packet);
        }
    }
};
