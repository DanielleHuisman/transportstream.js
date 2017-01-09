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
controller.on('pat', (pat, updates) => {
    console.log('new PAT', updates, pat);
});
controllerStream.on('program-added', (program) => {
    console.log('new program', program);
});
controllerStream.on('program-updated', (program) => {
    console.log('updated program', program);
});

// Start the controllers
controller.start();
controllerStream.start();
