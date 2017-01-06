import Parser from './Parser';
import ParserTS from './ParserTS';
import ParserPSI from './ParserPSI';
import ParserDescriptor from './ParserDescriptor';
import ParserPAT from './ParserPAT';
import ParserNIT from './ParserNIT';
import ParserTDT from './ParserTDT';
import ParserTOT from './ParserTOT';
import ParserPMT from './ParserPMT';

// Export a map of Service Information Table parsers
export const tableParsers = {
    PAT: ParserPAT,
    NIT: ParserNIT,
    TDT: ParserTDT,
    TOT: ParserTOT,
    PMT: ParserPMT
};

// Export other parser
export {
    Parser,
    ParserTS,
    ParserPSI,
    ParserDescriptor
};
