import {REVERSE_PACKET_IDENTIFIERS} from '../constants';
import {PacketTDT, PacketTOT} from '../packets';

import Controller from './Controller';

const PID = REVERSE_PACKET_IDENTIFIERS.TDT;

export default class ControllerTime extends Controller {
    controllerTS = null;

    constructor(controllerTS) {
        super('Time');
        this.controllerTS = controllerTS;

        this.init();
    }

    init() {
        this.controllerTS.on('pid', (pid) => {
            // Check if it's the stream we're looking for
            if (pid === PID) {
                this.addListener();
            }
        });
    }

    start() {}

    addListener() {
        this.controllerTS.enableStream(PID);
        const stream = this.controllerTS.getStream(PID);
        stream.on('readable', this.handlePackets);
    }

    handlePackets = () => {
        const stream = this.controllerTS.getStream(PID);
        let packet = null;

        while ((packet = stream.read(1)) !== null) {
            if (packet instanceof PacketTDT) {
                this.emit('tdt', packet);
            } else if (packet instanceof PacketTOT) {
                this.emit('tot', packet);
            }
        }
    }
};
