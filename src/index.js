import hyperquest from 'hyperquest';

import config from './config';
import {ControllerTS, ControllerPMT, ControllerStream, ControllerAV, ControllerSubtitles, ControllerInformation} from './controllers';
import {Player} from './player';

// Open input stream (HTTP stream)
const inputStream = hyperquest.get(config.url);

// Intialize controllers
const controllerTS = new ControllerTS(inputStream, 1000000);
const controllerPMT = new ControllerPMT(controllerTS);
const controllerStream = new ControllerStream(controllerTS, controllerPMT);
const controllerAV = new ControllerAV(controllerTS);
const controllerSubtitles = new ControllerSubtitles(controllerTS);
const controllerInformation = new ControllerInformation(controllerTS);

// Initialize player
const player = new Player(document.getElementById('player'), 720, 576);
player.resize(1280, 720);

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
    if (event.runningStatus === 4) {
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

const renderClut = (versionId, clut) => {
    if (!clut) {
        return;
    }

    for (const entry of Object.values(clut.entries)) {
        const unit = document.createElement('div');
        unit.textContent = `color ${entry.id}`;
        unit.style.color = yuvToRgb(entry);

        document.getElementById(`test-clut-${versionId}-${clut.id}`).appendChild(unit);
    }
};

const tr0 = document.createElement('tr');
let td = document.createElement('td');
td.textContent = 'CLUT 0';
td.style.fontWeight = 'bold';
tr0.appendChild(td);

const tr1 = document.createElement('tr');
td = document.createElement('td');
td.textContent = 'CLUT 1';
td.style.fontWeight = 'bold';
tr1.appendChild(td);

for (let i = 0; i < 16; i++) {
    const td0 = document.createElement('td');
    td0.id = `test-clut-${i}-0`;
    const td1 = document.createElement('td');
    td1.id = `test-clut-${i}-1`;

    const th = document.createElement('th');
    th.textContent = `Version ${i}`;

    tr0.appendChild(td0);
    tr1.appendChild(td1);
    document.getElementById('test-clut-header').appendChild(th);
}

document.getElementById('test-clut-body').appendChild(tr0);
document.getElementById('test-clut-body').appendChild(tr1);

controllerSubtitles.on('subtitles', (packet) => {
    // console.log(packet);

    player.renderers[0].onPacket(packet);

    for (const segment of packet.segments) {
        if (!pages[segment.pageId]) {
            pages[segment.pageId] = {};
        }
        const page = pages[segment.pageId];

        if (segment.type >= 16 && segment.type < 20) {
            if (!page[segment.parsedData.versionNumber]) {
                page[segment.parsedData.versionNumber] = {
                    version: segment.parsedData.versionNumber,
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

                version.timeOut = segment.parsedData.timeOut;
                version.state = segment.parsedData.state;
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

    // console.log(pages);

    for (const page of Object.values(pages)) {
        for (const version of Object.values(page)) {
            document.getElementById(`test-clut-${version.version}-0`).innerHTML = '';
            document.getElementById(`test-clut-${version.version}-1`).innerHTML = '';

            renderClut(version.version, version.cluts[0]);
            renderClut(version.version, version.cluts[1]);
        }
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
