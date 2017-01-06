import EventEmitter from 'events';

export default class Controller extends EventEmitter {
    name = null;

    constructor(name) {
        super();
        this.name = name;
    }

    start() {}
};
