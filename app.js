'use strict';

var config = require('./config');

var io = require('socket.io')(8888),
    redis = require('redis'),
    apns = require('apn'),
    gcm = require('android-gcm'),
    raven = require('raven'),
    client = new raven.Client(config.sentryDSN, { level: 'error' }),
    consumer = redis.createClient(config.redis.port, config.redis.host, config.redis);

var pushGCM = function pushGCM(message) {
    var data = JSON.parse(message);

    if (data.GCMAPIKey === undefined ||
        data.androidRegistrationIds === undefined)
        return;

    var reportId = data.reportId || null;
    var gcmObject = new gcm.AndroidGcm(data.GCMAPIKey),
        gcmMessage = new gcm.Message({
            registration_ids: data.androidRegistrationIds,
            data: {
                id: data.id,
                message: data.message,
                type: data.type.toLowerCase(),
                reportId: reportId
            }
        });

    gcmMessage.delay_while_idle = true;
    gcmMessage.time_to_live = config.gcm.time_to_live;

    gcmObject.send(gcmMessage, function(err) {
        if (err) {
            console.log('ERROR:', err);
            try {
                var options = {
                    extra: {
                        GCMPayload: gcmMessage
                    },
                    tags: {
                        service: 'gcm'
                    }
                };

                client.captureError(err, options, function (response) {
                    console.log('Sentry Error ID :', response.id);
                });
            }
            catch (err) {
                // Do nothing.
                console.log('- err of err', err);
            }
        }
    });
};

var apnsConnection = new apns.Connection({
    cert: config.apns.key,
    key: config.apns.key
});

var pushAPNS = function pushAPNSmessage(message) {
     // "20344c0e7c1ba256474fc3bbe5b34b76fe5c54c8d534baccdaebab420ee71a7e"
    var data = JSON.parse(message);

    if (data.apnsRegistrationIds === undefined)
        return;

    data.apnsRegistrationIds.forEach(function(apnsRegistrationId, i) {

        try {
            var apnsDevice = new apns.Device(apnsRegistrationId);
            console.log('SEND TOKEN:', apnsRegistrationId);
        }
        catch (err) {
            console.log('ERROR TOKEN:', err);
            return;
        }
        var apnsMessage = new apns.Notification();

        var reportId = data.reportId || null;
        apnsMessage.expiry = Math.floor(Date.now() / 1000) + config.apns.expiry,
        apnsMessage.badge = data.badge;
        apnsMessage.sound = "default";
        apnsMessage.alert = data.message;
        apnsMessage.payload = {'reportId': reportId};



        apnsConnection.pushNotification(apnsMessage, apnsDevice, function(err) {
            console.log('ERROR:', err);
            try {
                var options = {
                    extra: {
                        APNSPayload: apnsMessage
                    },
                    tags: {
                        service: 'apns'
                    }
                };

                client.captureError(err, options, function (response) {
                    console.log('Sentry Error ID :', response.id);
                });
            }
            catch (err) {
                console.log('- err of err', err);
            }
        });
    });
};

consumer.on('message', function (channel, message) {
    console.log('New upcoming message from channel: /', channel, '/');
    var i;
    for (i in io.sockets.connected) {
        io.sockets.connected[i].emit(channel, message);
    }

    if (channel === 'news:new') {
        pushGCM(message);
        pushAPNS(message);
    }

});

consumer.subscribe(
    'report:new',
    'report:comment:new',
    'report:image:new',
    'report:flag:new',
    'report:state:new',
    'mention:new',
    'news:new',
    'user:avatar:new'
);

io.on('connection', function (socket) {
    console.log('client connected id:', socket.conn.id,
                ' from:', socket.handshake.headers.origin);
});

io.serveClient();
console.log('Listening on 0.0.0.0:8888 ...');
