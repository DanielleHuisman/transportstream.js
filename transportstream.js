var through = require('through2');
var hyperquest = require('hyperquest');
var config = require('./config');

var stream = through();
hyperquest.get(config.url).pipe(stream);

var counter = 0;
stream.on('readable', function() {
    var data = this.read(188);
    while (data !== null) {
        if (data) {
            var packet = readPacket(data);

            if (packet.pid == 0) {
                // TODO: PAT
            } else if (packet.pid === 1) {
                // TODO: CAT
            } else if (packet.pid >= 32 && packet.pid <= 8186) {
                // TODO: PMT
            }

            if (counter < 10 && packet.pid < 2) {
                console.log(data);
                console.log(readPacket(data));
            }
            counter++;
        }
        data = this.read(188);
    }
}).on('end', function() {
    console.log('stream ended');
}).on('error', function(err) {
    console.error(err);
});

// TODO: convert this whole thing to a series of (object ?) streams
// raw byte stream --> 188 byte sized MPEG-TS packets --> Payload packets

var readPacket = function(data) {
    var packet = {};

    if (data.length < 188 || data[0] != 0x47) {
        return null;
    }

    packet.transportErrorIndicator = (data[1] & 0x80) !== 0;
    packet.payloadUnitStartIndicator = (data[1] & 0x40) !== 0;
    packet.transportPriority = (data[1] & 0x20) !== 0;
    packet.pid = (data[1] & 0x1f) << 8 | data[2];

    packet.scramblingControl = data[3] & 0xc0;
    packet.hasAdaption = (data[3] & 0x20) !== 0;
    packet.hasPayload = (data[3] & 0x10) !== 0;
    packet.continuityCounter = data[3] & 0x0f;

    var start = 4;

    if (packet.hasAdaption) {
        packet.adaptionLength = data[4];

        if (packet.adaptionLength === 0) {
            packet.hasAdaption = false;
        } else {
            packet.discontinuityIndicator = (data[5] & 0x80) !== 0;
            packet.randomAccessInicator = (data[5] & 0x40) !== 0;
            packet.elementaryStreamPriority = (data[5] & 0x20) !== 0;
            packet.hasPCR = (data[5] & 0x10) !== 0;
            packet.hasOPCR = (data[5] & 0x08) !== 0;
            packet.hasSplicingPoint = (data[5] & 0x04) !== 0;
            packet.hasTransportPrivateData = (data[5] & 0x02) !== 0;
            packet.hasAdaptionExtension = (data[5] & 0x01) !== 0;

            start += 2;

            if (packet.hasPCR) {
                var pcr = data.slice(start, start + 6);

                packet.pcrBase = (pcr[0] << 25) | (pcr[1] << 17) | (pcr[ 2] << 9) | (pcr[3] << 1) | ((pcr[4] & 0x80) >> 7);
                packet.pcrExtension = ((pcr[4] & 0x01) << 8) | pcr[5];
                packet.pcr = packet.pcrBase * 300 + packet.pcrExtension;

                start += 6;
            }

            if (packet.hasOPCR) {
                start += 6;
            }

            if (packet.hasSplicingPoint) {
                packet.splicingPoint = ((data[start] & 0x80) == 1 ? -1 : 1) * data[start] & 0x7f;
                start++;
            }

            if (packet.hasTransportPrivateData) {
                packet.transportPrivateDataLength = data[start];
                start++;

                packet.transportPrivateData = data.slice(start, start + packet.transportPrivateDataLength);
                start += packet.transportPrivateDataLength;
            }

            if (packet.hasAdaptionExtension) {
                packet.adaptionExtensionLength = data[start];

                // TODO: parse adaption extension

                start += packet.adaptionExtensionLength;
            }
        }
    }

    if (packet.hasPayload) {
        packet.payload = data.slice(start, 188);
    }

    return packet;
};
