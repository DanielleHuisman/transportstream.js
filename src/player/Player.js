import SubtitleRenderer from './SubtitleRenderer';

export default class Player {
    constructor(mount, width, height) {
        this.mount = mount;
        this.width = width;
        this.height = height;
        this.renderers = [];

        this.initialize();
        this.start();
    }

    initialize() {
        // Initialize wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'relative';
        this.mount.appendChild(this.wrapper);

        // Initialize video
        this.video = document.createElement('video');
        this.video.style.position = 'relative';
        this.video.style.left = '0px';
        this.video.style.top = '0px';
        this.video.style.width = `${this.width}px`;
        this.video.style.height = `${this.height}px`;
        this.video.style['z-index'] = '1';
        this.video.style['background-color'] = 'black';
        this.wrapper.appendChild(this.video);

        // Initialize canvas
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0px';
        this.canvas.style.top = '0px';
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.canvas.style['z-index'] = '2';
        this.wrapper.appendChild(this.canvas);

        // Render loading text
        this.renderLoading();

        this.renderers.push(new SubtitleRenderer(this));
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        // Resize video
        this.video.style.width = `${this.width}px`;
        this.video.style.height = `${this.height}px`;

        // Resive canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        // Render loading text
        this.renderLoading();
    }

    renderLoading() {
        this.context.fillStyle = '#ffffff';
        this.context.font = '64px Arial';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText('Loading', this.width / 2, this.height / 2);
    }

    start() {
        if (!this.running) {
            this.running = true;

            this.run();
        }
    }

    stop() {
        this.running = false;
    }

    run() {
        window.requestAnimationFrame(() => {
            this.render();

            if (this.running) {
                this.run();
            }
        });
    }

    render() {
        this.context.clearRect(0, 0, this.width, this.height);

        for (const renderer of this.renderers) {
            renderer.render();
        }
    }
};
