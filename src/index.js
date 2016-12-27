import through from 'through2';
import hyperquest from 'hyperquest';

import config from './config';
import {ParserTS, ParserPSI, ParserPAT} from './parsers';

const stream = through();
const inputStream = hyperquest.get(config.url);
inputStream.pipe(stream);

const parserTS = new ParserTS();
const parserPSI = new ParserPSI();
const parserPAT = new ParserPAT();

let counter = 0;

stream.on('readable', () => {
    let data = null;
    while ((data = stream.read(188)) !== null) {
        const packetTS = parserTS.parse(data);
        if (packetTS.pid === 0) {
            const packetPSI = parserPSI.parse(packetTS.payload);
            const packetPAT = parserPAT.parse(packetPSI.tableData);

            console.log(packetTS, packetPSI, packetPAT);
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
