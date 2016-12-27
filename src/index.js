import through from 'through2';
import hyperquest from 'hyperquest';

import config from './config';
import {ParserTS, ParserPSI, ParserPAT, ParserNIT, ParserPMT} from './parsers';

const stream = through();
const inputStream = hyperquest.get(config.url);
inputStream.pipe(stream);

const parserTS = new ParserTS();
const parserPSI = new ParserPSI();
const parserPAT = new ParserPAT();
const parserNIT = new ParserNIT();
const parserPMT = new ParserPMT();

const programMapTables = {};
let counter = 0;

stream.on('readable', () => {
    let data = null;
    while ((data = stream.read(188)) !== null) {
        const packetTS = parserTS.parse(data);

        if (packetTS.pid < 32) {
            // Program Specific Information (PSI)
            const packetPSI = parserPSI.parse(packetTS.payload);

            if (packetTS.pid === 0 && packetPSI.tableId === 0x00) {
                // Program Association Table (PAT)
                const packetPAT = parserPAT.parse(packetPSI.tableData);

                console.log('PAT', packetTS, packetPSI, packetPAT);

                // Register program map tables
                for (const program of packetPAT.programs) {
                    programMapTables[program.pid] = true;
                }
            } else if (packetTS.pid === 16 && (packetPSI.tableId === 0x40 || packetPSI.tableId === 0x41)) {
                // Network Information Table (NIT)
                const packetNIT = parserNIT.parse(packetPSI.tableData);

                console.log('NIT', packetTS, packetPSI, packetNIT);
            } else if (packetPSI.tableId === 0x72) {
                // Stuffing Table (ST)
            }
        } else if (programMapTables[packetTS.pid]) {
            // Program Map Table (PMT)
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
