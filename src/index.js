import hyperquest from 'hyperquest';

import config from './config';
import {ControllerTS} from './controllers';
// import {ParserTS, ParserPSI, ParserPAT, ParserPMT, ParserNIT, ParserTDT, ParserTOT, ParserDescriptor} from './parsers';

// Open input stream (HTTP stream)
const inputStream = hyperquest.get(config.url);

const controller = new ControllerTS(inputStream, 100000);

controller.on('pid', (pid) => {
    if (pid !== 16) {
        return;
    }

    const stream = controller.getStream(pid);
    stream.on('readable', () => {
        console.log('YUP', stream.read(1));
    });
});

controller.start();

// const parserPSI = new ParserPSI();
// const parserPAT = new ParserPAT();
// const parserPMT = new ParserPMT();
// const parserNIT = new ParserNIT();
// const parserTDT = new ParserTDT();
// const parserTOT = new ParserTOT();
// const parserDescriptor = new ParserDescriptor();

// const programMapTables = {};

// if (packetTS.pid < 32) {
//     // Program Specific Information (PSI)
//     const packetPSI = parserPSI.parse(packetTS.payload);
//
//     if (packetTS.pid === 0x00 && packetPSI.tableId === 0x00) {
//         // Program Association Table (PAT)
//         const packetPAT = parserPAT.parse(packetPSI.tableData);
//
//         // console.log('PAT', packetPAT);
//
//         // Register program map tables
//         for (const program of packetPAT.programs) {
//             programMapTables[program.pid] = true;
//         }
//     } else if (packetTS.pid === 0x10 && (packetPSI.tableId === 0x40 || packetPSI.tableId === 0x41)) {
//         // Network Information Table (NIT)
//         const packetNIT = parserNIT.parse(packetPSI.tableData);
//
//         // Parse descriptors
//         packetNIT.descriptors.forEach((descriptor) => parserDescriptor.parse(descriptor));
//         packetNIT.streams.forEach((stream) => {
//             stream.descriptors.forEach((descriptor) => parserDescriptor.parse(descriptor));
//         });
//
//         console.log('NIT', packetNIT, packetPSI);
//     } else if (packetTS.pid === 0x14 && packetPSI.tableId === 0x70) {
//         // Time and Date Table (TDT)
//         const packetTDT = parserTDT.parse(packetPSI.tableData);
//
//         console.log('TDT', packetTDT);
//     } else if (packetPSI.tableId === 0x72) {
//         // Stuffing Table (ST)
//     } else if (packetTS.pid === 0x14 && packetPSI.tableId === 0x73) {
//         // Time Offset Table (TOT)
//         const packetTOT = parserTOT.parse(packetPSI.tableData);
//
//         console.log('TOT', packetTOT);
//     }
// } else if (programMapTables[packetTS.pid]) {
//     // Program Map Table (PMT)
//     const packetPSI = parserPSI.parse(packetTS.payload);
//     const packetPMT = parserPMT.parse(packetPSI.tableData);
//
//     // Parse descriptors
//     packetPMT.programDescriptors.forEach((descriptor) => parserDescriptor.parse(descriptor));
//     packetPMT.streams.forEach((stream) => {
//         stream.descriptors.forEach((descriptor) => parserDescriptor.parse(descriptor));
//     });
//
//     console.log('PMT', packetPMT, packetPSI);
// }
