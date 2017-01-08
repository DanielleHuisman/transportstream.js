import Controller from './Controller';

export default class ControllerStream extends Controller {
    controllerTS = null;

    constructor(controllerTS) {
        super('stream');
        this.controllerTS = controllerTS;

        this.controllerTS.on('pat', this.handlePATUpdate);
    }

    start() {
    }

    handlePATUpdate(programMapTables, updates) {
        console.log('PAT updates:', updates, programMapTables);
    }
};
