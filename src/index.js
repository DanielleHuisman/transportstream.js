import hyperquest from 'hyperquest';

import config from './config';
import {ControllerTS} from './controllers';

// Open input stream (HTTP stream)
const inputStream = hyperquest.get(config.url);

// Intialize controller
const controller = new ControllerTS(inputStream, 100000);

controller.on('pid', (pid) => {
    console.log('new stream', pid);

    if (pid !== 16) {
        return;
    }

    const stream = controller.getStream(pid);
    stream.on('readable', () => {
        console.log('YUP', stream.read(1));
    });
});

// Start the controller
controller.start();
