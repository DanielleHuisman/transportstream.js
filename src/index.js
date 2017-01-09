import hyperquest from 'hyperquest';

import config from './config';
import {ControllerTS, ControllerPMT} from './controllers';

// Open input stream (HTTP stream)
const inputStream = hyperquest.get(config.url);

// Intialize controllers
const controller = new ControllerTS(inputStream, 100000);
const controllerPMT = new ControllerPMT(controller);

// Register event handlers
controller.on('pid', (pid) => {
    console.log('new stream', pid);
});
controller.on('pat', (pat, updates) => {
    console.log('new PAT', updates, pat);
});
controllerPMT.on('program-added', (program) => {
    console.log('new program', program);
});
controllerPMT.on('program-updated', (program) => {
    console.log('updated program', program);
});

// Start the controllers
controller.start();
controllerPMT.start();
