const fetch = require('node-fetch');
const ffprobe = require('ffprobe');

(async () => {
    try {
        const response = await fetch('http://iptv.danielhuisman.io/api/channels.php');
        const data = await response.json();

        const channels = [];
        for (const channel of data) {
            if (channel.address) {
                channels.push({
                    name: channel.name,
                    address: channel.address,
                    hd: false
                });
            }
            if (channel.hd_address) {
                channels.push({
                    name: channel.name,
                    address: channel.hd_address,
                    hd: true
                });
            }
        }

        const channelsWithSubtitles = [];
        for (const channel of channels) {
            try {
                console.log('probing', channel.name, channel.hd ? 'HD' : '', `(${channel.address})`);
                const info = await ffprobe(`http://noc-cmk.vck.utwente.nl:6969/udp/${channel.address}`, {path: '/usr/bin/ffprobe'});

                for (const stream of info.streams) {
                    console.log(stream.index, stream.codec_type, stream.codec_name, stream.codec_long_name);

                    if (stream.codec_name === 'dvb_subtitle') {
                        channelsWithSubtitles.push(channel);
                        break;
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }

        console.log();
        console.log(channelsWithSubtitles.map((channel) => `${channel.name} ${channel.hd ? 'HD' : ''} (${channel.address})`));
    } catch (err) {
        console.error(err);
    }
})();
