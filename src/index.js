import hyperquest from 'hyperquest';

import config from './config';
import {ControllerTS, ControllerPMT, ControllerStream, ControllerAV, ControllerSubtitles, ControllerInformation} from './controllers';

// Open input stream (HTTP stream)
const inputStream = hyperquest.get(config.url);

// Intialize controllers
const controllerTS = new ControllerTS(inputStream, 1000000);
const controllerPMT = new ControllerPMT(controllerTS);
const controllerStream = new ControllerStream(controllerTS, controllerPMT);
const controllerAV = new ControllerAV(controllerTS);
const controllerSubtitles = new ControllerSubtitles(controllerTS);
const controllerInformation = new ControllerInformation(controllerTS);

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

    if (updates.indexOf('audio') !== -1) {
        controllerAV.setAudioStream(streams.audio);
    }
    if (updates.indexOf('video') !== -1) {
        controllerAV.setVideoStream(streams.video);
    }
    if (updates.indexOf('subtitles') !== -1) {
        controllerSubtitles.setStream(streams.subtitles);
    }
});

controllerInformation.enable('time', 'service');
controllerInformation.on('time-date', (packet) => {
    console.log('TDT', packet.utc);
});
controllerInformation.on('time-offset', (packet) => {
    console.log('TOT', packet.utc, 'offset:', packet.descriptors[0] ? packet.descriptors[0].parsedData[0].offset : undefined);
});
controllerInformation.on('service', (service) => {
    console.log('SDT', service);
});

// // Create media source
// const buffers = [];
// let isLoading = false;
// let sourceBuffer = false;
// const mediaSource = new MediaSource();
// mediaSource.addEventListener('error', console.error);
// mediaSource.addEventListener('sourceopen', () => {
//     sourceBuffer = mediaSource.addSourceBuffer('audio/aac');
//     sourceBuffer.addEventListener('updateend', () => {
//         if (buffers.length > 0) {
//             console.log('appending', buffers[0].byteLength);
//             sourceBuffer.appendBuffer(buffers.shift());
//             isLoading = true;
//         } else {
//             isLoading = false;
//         }
//     });
// });
//
// // Create audio tag
// const audio = document.createElement('audio');
// audio.src = URL.createObjectURL(mediaSource);
// document.body.append(audio);
//
// console.log('IS AAC SUPPORTED:', MediaSource.isTypeSupported('audio/aac'));
//
// controllerAV.on('audio', (buffer) => {
//     if (isLoading || !sourceBuffer) {
//         buffers.push(buffer);
//     } else {
//         console.log('appending', buffer.byteLength);
//         sourceBuffer.appendBuffer(buffer);
//         isLoading = true;
//     }
// });
//
// setTimeout(() => {
//     // mediaSource.endOfStream();
//     console.log('PLAYING', mediaSource);
//     // audio.play();
// }, 1000 * 20);

// Start the controllers
controllerTS.start();
controllerPMT.start();
controllerStream.start();
controllerAV.start();
controllerSubtitles.start();
controllerInformation.start();
