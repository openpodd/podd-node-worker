var apn  = require("apn")

var apnConnection = new apn.Connection({
  "cert": "cert.pem",
  "key":  "key.pem",
      "port": 2195,
    "enhanced": true,
    "cacheLength": 5,
    "production": true
});


var params = {token:'67616c6e0568c4a2cca42dc5ed8c0a368ce740e23de90a6b72f0c47783d8915e', message:'Test message 2', from: 'sender'};

var myDevice = new apn.Device(params.token);
var note = new apn.Notification();

note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
note.badge = 1;
note.sound = "default";
note.alert = params.message;
note.payload = {'messageFrom': params.from};

apnConnection.pushNotification(note, myDevice);

console.log('cccc')