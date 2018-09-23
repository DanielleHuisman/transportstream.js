import Renderer from './Renderer';

const COLORS = {
    0: '#FF0000',
    1: '#00FF00',
    2: '#0000FF'
};

const yuvToRgb = (color) => {
    const r = 1.164 * (color.y - 16) + 1.596 * (color.cr - 128);
    const g = 1.164 * (color.y - 16) - 0.813 * (color.cr - 128) - 0.391 * (color.cb - 128);
    const b = 1.164 * (color.y - 16) + 2.018 * (color.cb - 128);

    return [r, g, b];
};

export default class SubtitleRenderer extends Renderer {
    updates = 0;
    queue = [];
    current = null;

    handleTimeout = () => {
        for (const segment of this.current.segments) {
            if (segment.type === 0x10) {
                setTimeout(() => {
                    if (this.queue.length > 0) {
                        const p = this.queue.pop();
                        console.log(p);
                        this.current = p;
                        this.handleTimeout();
                    } else {
                        this.current = null;
                    }
                }, segment.parsedData.regions.length === 0 ? 500 : segment.parsedData.timeOut * 100);
            }
        }
    }

    onPacket(packet) {
        if (!this.current) {
            this.current = packet;
            this.handleTimeout();
        } else {
            this.queue.push(packet);
        }
    }

    render() {
        this.context.fillStyle = '#ffffff';
        this.context.font = '64px Arial';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText(Math.floor(++this.updates / 60).toString(), this.player.width / 2, this.player.height / 2);

        const regions = {};
        const cluts = {};
        const objects = {};

        if (this.current) {
            for (const segment of this.current.segments) {
                if (segment.type === 0x10) {
                    for (const region of segment.parsedData.regions) {
                        regions[region.id] = region;
                    }
                } else if (segment.type === 0x11) {
                    const region1 = segment.parsedData;
                    const region2 = regions[region1.id];
                    if (region2) {
                        region2.width = region1.width;
                        region2.height = region1.height;
                        region2.objects = region1.objects;
                        region2.clutId = region1.clutId;
                    } else {
                        // This region is present on the page, so don't render it
                    }
                } else if (segment.type === 0x12) {
                    cluts[segment.parsedData.id] = segment.parsedData.entries;
                } else if (segment.type === 0x13) {
                    objects[segment.parsedData.id] = segment.parsedData;
                }
            }
        }

        for (const region of Object.values(regions)) {
            const offsetX = region.horizontalAddress + (this.player.width - region.width) / 2;
            const offsetY = region.verticalAddress;

            this.context.fillStyle = COLORS[region.id];
            this.context.fillRect(offsetX, offsetY, region.width, region.height);

            for (const object1 of region.objects) {
                const image = this.context.getImageData(offsetX, offsetY, region.width, region.height);

                const object2 = objects[object1.id];
                if (object2) {
                    if (object2.codingMethod === 0) {
                        const clut = cluts[region.clutId];
                        if (!clut) {
                            console.error('no clut', region.clutId);
                        }

                        for (let j = 0; j < object2.topField.length; j++) {
                            for (let i = 0; i < object2.topField[j][0].code4bit.length; i++) {
                                const value = object2.topField[j][0].code4bit[i];
                                const x = i + object1.horizontalPosition;
                                const y = j + object1.verticalPosition;

                                if (value !== 0) {
                                    const index = (x + y * region.width) * 4;
                                    const [r, g, b] = yuvToRgb(clut[value]);

                                    image.data[index] = r;
                                    image.data[index + 1] = g;
                                    image.data[index + 2] = b;
                                    image.data[index + 3] = 255;
                                }
                            }
                        }

                        for (let j = 0; j < object2.bottomField.length; j++) {
                            for (let i = 0; i < object2.bottomField[j][0].code4bit.length; i++) {
                                const value = object2.topField[j][0].code4bit[i];
                                const x = i + object1.horizontalPosition;
                                const y = 1 + j + object1.verticalPosition;

                                if (value !== 0) {
                                    const index = (x + y * region.width) * 4;
                                    const [r, g, b] = yuvToRgb(clut[value]);

                                    image.data[index] = r;
                                    image.data[index + 1] = g;
                                    image.data[index + 2] = b;
                                    image.data[index + 3] = 255;
                                }
                            }
                        }
                    } else if (object2.codingMethod === 1) {
                        // TODO: text
                    } else if (object2.codingMethod === 2) {
                        // TODO: compressed bitmap
                    }
                }

                this.context.putImageData(image, offsetX, offsetY);
            }
        }
    }
};
