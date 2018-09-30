import AV from 'av';
import 'av/src/devices/webaudio.js';
import {AC3Demuxer, AC3Decoder} from 'ac3.js';

import Component from './Component';

// Register demuxer and decoder
AV.Demuxer.register(AC3Demuxer);
AV.Decoder.register('ac3', AC3Decoder);

class BufferSource extends AV.EventEmitter {
    constructor() {
        super();
    }

    start() {}
    pause() {}
    reset() {}
};

export default class Audio extends Component {
    onPacket(packet) {
        if (!this.audioPlayer) {
            this.buffer = new BufferSource();
            this.audioPlayer = new AV.Player(new AV.Asset(this.buffer));
            this.counter = 0;

            console.log(this.audioPlayer, this.buffer);

            this.audioPlayer.on('format', (format) => console.log('player format', format));
            this.audioPlayer.on('ready', () => console.log('player ready'));
        }

        this.buffer.emit('data', new AV.Buffer(packet.payload));

        if (this.counter === 10) {
            this.audioPlayer.play();
            console.log('PLAY', this.audioPlayer);
        }
        this.counter++;
    }
};
