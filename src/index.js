import through from 'through2';
import hyperquest from 'hyperquest';

import config from './config';
import {ParserTS, ParserPSI, ParserPAT, ParserPMT} from './parsers';

const stream = through();
const inputStream = hyperquest.get(config.url);
inputStream.pipe(stream);

const parserTS = new ParserTS();
const parserPSI = new ParserPSI();
const parserPAT = new ParserPAT();
const parserPMT = new ParserPMT();

const programMapTables = {};
let counter = 0;

stream.on('readable', () => {
    let data = null;
    while ((data = stream.read(188)) !== null) {
        const packetTS = parserTS.parse(data);
        if (packetTS.pid === 0) {
            const packetPSI = parserPSI.parse(packetTS.payload);
            const packetPAT = parserPAT.parse(packetPSI.tableData);

            console.log('PAT', packetTS, packetPSI, packetPAT);

            // Register program map tables
            for (const program of packetPAT.programs) {
                programMapTables[program.pid] = true;
            }
        } else if (programMapTables[packetTS.pid]) {
            const packetPSI = parserPSI.parse(packetTS.payload);
            const packetPMT = parserPMT.parse(packetPSI.tableData);

            console.log('PMT', packetTS, packetPSI, packetPMT);
        }

        // End stream after a few packets
        if (counter > 1000) {
            inputStream.destroy();
        } else {
            counter++;
        }
    }
}).on('end', () => {
    console.log('stream ended');
}).on('error', (err) => {
    console.error(err);
});
