import hyperquest from 'hyperquest';

import config from './config';
import {ControllerTS, ControllerStream} from './controllers';

// Open input stream (HTTP stream)
const inputStream = hyperquest.get(config.url);

// Intialize controllers
const controller = new ControllerTS(inputStream, 100000);
const controllerStream = new ControllerStream(controller);

// Register event handlers
controller.on('pid', (pid) => {
    console.log('new stream', pid);
});

// Start the controllers
controller.start();
controllerStream.start();
