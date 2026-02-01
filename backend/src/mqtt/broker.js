const aedes = require("aedes")();
const { createServer } = require("net");

const startBroker = () => {
  const port = 1883;
  const server = createServer(aedes.handle);

  server.listen(port, function () {
    console.log("MQTT Broker started and listening on port ", port);
  });

  // Authentication Handler (Phase 1 preparation)
  aedes.authenticate = function (client, username, password, callback) {
    // Phase 1: Verify deviceId (username) and secret (password)
    // For now, allow all
    callback(null, true);
  };

  return aedes;
};

module.exports = startBroker;
