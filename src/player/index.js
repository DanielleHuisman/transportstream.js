export default class Player {
    constructor(mount, width, height) {
        this.mount = mount;
        this.width = width;
        this.height = height;

        this.initialize();
    }

    initialize() {
        // Initialize wrapper
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        this.mount.appendChild(wrapper);

        // Initialize video
        const video = document.createElement('video');
        video.style.position = 'relative';
        video.style.left = '0px';
        video.style.top = '0px';
        video.style.width = `${this.width}px`;
        video.style.height = `${this.height}px`;
        video.style['z-index'] = '1';
        video.style['background-color'] = 'black';
        wrapper.appendChild(video);

        // Initialize canvas
        const canvas = document.createElement('canvas');
        this.context = canvas.getContext('2d');
        canvas.width = this.width;
        canvas.height = this.height;
        canvas.style.position = 'absolute';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.style.width = `${this.width}px`;
        canvas.style.height = `${this.height}px`;
        canvas.style['z-index'] = '2';
        wrapper.appendChild(canvas);

        // Render loading text
        this.context.fillStyle = '#ffffff';
        this.context.font = '64px Arial';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText('Loading', this.width / 2, this.height / 2);
    }
};
