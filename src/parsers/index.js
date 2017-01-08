import Parser from './Parser';
import ParserTS from './ParserTS';
import ParserPSI from './ParserPSI';
import ParserDescriptor from './ParserDescriptor';
import ParserPAT from './ParserPAT';
import ParserNIT from './ParserNIT';
import ParserTDT from './ParserTDT';
import ParserTOT from './ParserTOT';
import ParserPMT from './ParserPMT';
import ParserPES from './ParserPES';

// Export a map of Service Information Table parsers
export const tableParsers = {
    PAT: new ParserPAT(),
    NIT: new ParserNIT(),
    TDT: new ParserTDT(),
    TOT: new ParserTOT(),
    PMT: new ParserPMT()
};

// Export parsers
export {
    Parser,
    ParserTS,
    ParserPSI,
    ParserDescriptor,
    ParserPAT,
    ParserNIT,
    ParserTDT,
    ParserTOT,
    ParserPMT,
    ParserPES
};
