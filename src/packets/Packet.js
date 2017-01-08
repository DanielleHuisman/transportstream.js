export default class Packet {
    data = null;
    length = 0;
    parent = null;

    constructor(data) {
        this.data = data;
        this.length = data ? data.length : 0;
    }
};
