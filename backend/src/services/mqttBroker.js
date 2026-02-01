const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const port = 1883;

const startBroker = () => {
  server.listen(port, function () {
    console.log('MQTT Broker running on port ' + port);
  });

  aedes.on('client', function (client) {
    console.log('MQTT Client Connected: ' + (client ? client.id : client));
  });

  aedes.on('publish', function (packet, client) {
    if (client) {
      console.log('MQTT Message from client', client.id, 'Topic:', packet.topic);
    }
  });
  
  return aedes;
};

module.exports = startBroker;
