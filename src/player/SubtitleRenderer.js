import Renderer from './Renderer';

export default class SubtitleRenderer extends Renderer {
    updates = 0;

    render() {
        this.context.fillStyle = '#ffffff';
        this.context.font = '64px Arial';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText(Math.floor(++this.updates / 60).toString(), this.player.width / 2, this.player.height / 2);
    }
};
