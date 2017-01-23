import hyperquest from 'hyperquest';

import config from './config';
import {ControllerTS, ControllerPMT, ControllerStream, ControllerAV, ControllerSubtitles} from './controllers';

// Open input stream (HTTP stream)
const inputStream = hyperquest.get(config.url);

// Intialize controllers
const controllerTS = new ControllerTS(inputStream, 1000000);
const controllerPMT = new ControllerPMT(controllerTS);
const controllerStream = new ControllerStream(controllerTS, controllerPMT);
const controllerAV = new ControllerAV(controllerTS);
const controllerSubtitles = new ControllerSubtitles(controllerTS);

// Register event handlers
controllerTS.on('pid', (pid) => {
    console.log('new stream', pid);
});
controllerTS.on('pat', (pat, updates) => {
    console.log('new PAT', updates, pat);
});
controllerPMT.on('program-added', (program) => {
    console.log('new program', program);

    // Switch to the new program
    controllerStream.setProgram(program.id);
});
controllerPMT.on('program-updated', (program) => {
    console.log('updated program', program);
});
controllerStream.on('program-updated', (program) => {
    console.log('switched to program', program);
});
controllerStream.on('streams-updated', (streams, updates) => {
    console.log('switched streams', updates, streams);

    if (updates.indexOf('subtitles') !== -1) {
        controllerSubtitles.setStream(streams.subtitles);
    }
});

// Start the controllers
controllerTS.start();
controllerPMT.start();
controllerStream.start();
controllerAV.start();
controllerSubtitles.start();
