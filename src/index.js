import hyperquest from 'hyperquest';

import config from './config';
import {ControllerTS, ControllerPMT, ControllerStream, ControllerAV, ControllerSubtitles, ControllerTime} from './controllers';

// Open input stream (HTTP stream)
const inputStream = hyperquest.get(config.url);

// Intialize controllers
const controllerTS = new ControllerTS(inputStream, 1000000);
const controllerPMT = new ControllerPMT(controllerTS);
const controllerStream = new ControllerStream(controllerTS, controllerPMT);
const controllerAV = new ControllerAV(controllerTS);
const controllerSubtitles = new ControllerSubtitles(controllerTS);
const controllerTime = new ControllerTime(controllerTS);

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
controllerTime.on('tdt', (packet) => {
    console.log('TDT', packet.utc);
});
controllerTime.on('tot', (packet) => {
    console.log('TOT', packet.utc, 'offset:', packet.descriptors[0] ? packet.descriptors[0].parsedData[0].offset : undefined);
});

// Start the controllers
controllerTS.start();
controllerPMT.start();
controllerStream.start();
controllerAV.start();
controllerSubtitles.start();
controllerTime.start();
