import {REVERSE_PACKET_IDENTIFIERS} from '../constants';
import {PacketSDT, PacketEIT, PacketTDT, PacketTOT} from '../packets';

import Controller from './Controller';

const PIDS = {
    time: REVERSE_PACKET_IDENTIFIERS.SDT,
    event: REVERSE_PACKET_IDENTIFIERS.EIT,
    service: REVERSE_PACKET_IDENTIFIERS.TDT
};

export default class ControllerInformation extends Controller {
    controllerTS = null;
    pids = [];
    handlers = {};
    services = {};
    events = {};

    constructor(controllerTS) {
        super('Information');
        this.controllerTS = controllerTS;

        this.init();
    }

    init() {
        this.controllerTS.on('pid', (pid) => {
            // Check if it's the stream we're looking for
            if (this.pids.indexOf(pid) !== -1) {
                this.addListener(pid);
            }
        });
    }

    start() {}

    isEnabled(type) {
        return this.pids.indexOf(PIDS[type]) !== -1;
    }

    enable(...types) {
        for (const type of types) {
            const pid = PIDS[type];
            if (this.pids.indexOf(pid) === -1) {
                this.pids.push(pid);

                // Add a new listener if the stream is available
                if (this.controllerTS.hasStream(pid)) {
                    this.addListener(pid);
                }
            }
        }
    }

    disable(...types) {
        for (const type of types) {
            const pid = PIDS[type];
            if (this.pids.indexOf(pid) !== -1) {
                this.pids.splice(this.pids.indexOf(pid), 1);

                this.removeListener(pid);
            }
        }
    }

    addListener(streamId) {
        if (!this.handlers[streamId]) {
            this.controllerTS.enableStream(streamId);
            const stream = this.controllerTS.getStream(streamId);
            this.handlers[streamId] = this.handlePackets.bind(this, streamId);
            stream.on('readable', this.handlers[streamId]);
        }
    }

    removeListener(streamId) {
        if (this.handlers[streamId]) {
            this.controllerTS.disableStream(streamId);
            const stream = this.controllerTS.getStream(streamId);
            stream.off('readable', this.handlers[streamId]);
            delete this.handlerse[streamId];
        }
    }

    handlePackets = (streamId) => {
        const stream = this.controllerTS.getStream(streamId);
        let packet = null;

        while ((packet = stream.read(1)) !== null) {
            if (packet instanceof PacketSDT) {
                for (const service of packet.services) {
                    if (!this.services[service.id]) {
                        this.services[service.id] = service;
                        this.emit('service', service);
                    }
                }
            } else if (packet instanceof PacketEIT) {
                const serviceId = packet.parent.tableIdExtension;
                if (!this.events[serviceId]) {
                    this.events[serviceId] = {};
                }
                const events = this.events[serviceId];

                for (const rawEvent of packet.events) {
                    if (!events[rawEvent.id]) {
                        events[rawEvent.id] = {
                            id: rawEvent.id,
                            startTime: rawEvent.startTime,
                            duration: rawEvent.duration,
                            hasCA: rawEvent.hasCA,
                            runningStatus: rawEvent.runningStatus,
                            name: null,
                            languageCode: null,
                            shortDescription: null,
                            parentalRating: null,
                            descriptionArray: [],
                            description: null
                        };
                    }
                    const event = events[rawEvent.id];

                    for (const descriptor of rawEvent.descriptors) {
                        if (descriptor.name === 'short_event_descriptor') {
                            event.name = descriptor.parsedData.eventName;
                            event.languageCode = descriptor.parsedData.languageCode;
                            event.shortDescription = descriptor.parsedData.text;
                        } else if (descriptor.name === 'parental_rating_descriptor') {
                            event.parentalRating = descriptor.parsedData;
                        } else if (descriptor.name === 'extended_event_descriptor') {
                            if (event.descriptionArray) {
                                event.descriptionArray[descriptor.parsedData.number] = descriptor.parsedData.text;
                                let complete = true;
                                for (let i = 0; i <= descriptor.parsedData.lastNumber; i++) {
                                    if (!event.descriptionArray[i]) {
                                        complete = false;
                                        break;
                                    }
                                }
                                if (complete) {
                                    event.description = event.descriptionArray.join('');
                                    delete event.descriptionArray;

                                    this.emit('event', event);
                                }
                            }
                        }
                    }
                }
            } else if (packet instanceof PacketTDT) {
                this.emit('time-date', packet);
            } else if (packet instanceof PacketTOT) {
                this.emit('time-offset', packet);
            }
        }
    }
};
