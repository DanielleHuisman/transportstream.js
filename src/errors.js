export class ParseError extends Error {
    constructor(parser, message) {
        super();
        this.name = 'ParseError';
        this.message = `[${parser.name} parser] ${message]}`;
    }
};
