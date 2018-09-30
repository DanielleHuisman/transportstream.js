import Component from './Component';

export default class Renderer extends Component {
    constructor(player) {
        super(player);
        this.context = player.context;
    }

    render() {}
};
