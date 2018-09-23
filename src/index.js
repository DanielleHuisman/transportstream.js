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
        // controllerAV.setVideoStream(streams.video);
    }
    if (updates.indexOf('subtitles') !== -1) {
        controllerSubtitles.setStream(streams.subtitles.pid);
    }
});

controllerInformation.enable('service', 'event', 'time');
controllerInformation.on('service', (service) => {
    const data = service.descriptors[0] && service.descriptors[0].parsedData;
    console.log(service);
    if (data) {
        console.log('[SDT]', data.name, 'provided by', data.provider);
        document.getElementById('title').textContent = `${data.name} (provided by ${data.provider})`;
    }
});
controllerInformation.on('event', (event) => {
    if (event.runningStatus === 1) {
        console.log('[EIT]', event);
        document.getElementById('epg-title').textContent = event.name;
        document.getElementById('epg-description').textContent = event.description;
    }
});
controllerInformation.on('time-date', (packet) => {
    console.log('[TDT]', packet.utc);
});
controllerInformation.on('time-offset', (packet) => {
    console.log('[TOT]', packet.utc, 'offset:', packet.descriptors[0] ? packet.descriptors[0].parsedData[0].offset : undefined);
});

const pages = {};

const yuvToRgb = (color) => {
    const r = 1.164 * (color.y - 16) + 1.596 * (color.cr - 128);
    const g = 1.164 * (color.y - 16) - 0.813 * (color.cr - 128) - 0.391 * (color.cb - 128);
    const b = 1.164 * (color.y - 16) + 2.018 * (color.cb - 128);

    return `rgb(${r}, ${g}, ${b})`;
};

const renderClut = (clut) => {
    if (!clut) {
        return;
    }

    document.getElementById(`test-clut-${clut.id}`).innerHTML = '';
    for (const entry of Object.values(clut.entries)) {
        const unit = document.createElement('div');
        unit.textContent = `color ${entry.id}`;
        unit.style.color = yuvToRgb(entry);

        document.getElementById(`test-clut-${clut.id}`).appendChild(unit);
    }
};

controllerSubtitles.on('subtitles', (packet) => {
    // console.log(packet);

    for (const segment of packet.segments) {
        if (!pages[segment.pageId]) {
            pages[segment.pageId] = {};
        }
        const page = pages[segment.pageId];

        if (segment.type >= 16 && segment.type < 20) {
            if (!page[segment.parsedData.versionNumber]) {
                page[segment.parsedData.versionNumber] = {
                    regions: {},
                    objects: {},
                    cluts: {}
                };
            }
            const version = page[segment.parsedData.versionNumber];

            if (segment.type === 16) {
                for (const region of segment.parsedData.regions) {
                    version.regions[region.id] = region;
                }
            } else if (segment.type === 17) {
                version.regions[segment.parsedData.id] = {
                    ...version.regions[segment.parsedData.id],
                    ...segment.parsedData
                };
            } else if (segment.type === 18) {
                version.cluts[segment.parsedData.id] = segment.parsedData;
            } else if (segment.type === 19) {
                version.objects[segment.parsedData.id] = segment.parsedData;
            }
        }
    }

    console.log(pages);

    if (pages[2] && pages[2][0]) {
        console.log('found test clut');

        renderClut(pages[2][0].cluts[0]);
        renderClut(pages[2][0].cluts[1]);
    }
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
