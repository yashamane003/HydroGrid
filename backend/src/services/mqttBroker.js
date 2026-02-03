const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
const port = 1883;

const startBroker = () => {
  server.listen(port, "0.0.0.0", function () {
    console.log("MQTT Broker running on port " + port);
  });

  aedes.on("client", function (client) {
    console.log("MQTT Client Connected: " + (client ? client.id : client));
  });

  const Device = require("../models/deviceModel");
  const DeviceTelemetry = require("../models/telemetryModel");

  aedes.on("publish", async function (packet, client) {
    if (client) {
      // Log all messages for debugging
      console.log(`[MQTT] Topic: ${packet.topic} from Client: ${client.id}`);

      // Topic format: company/{companyId}/device/{deviceId}/telemetry
      if (packet.topic.endsWith("/telemetry")) {
        try {
          const parts = packet.topic.split("/");
          // parts = ['company', companyId, 'device', deviceId, 'telemetry']
          const deviceId = parts[3];
          const payload = JSON.parse(packet.payload.toString());

          // Find Device
          const device = await Device.findOne({ deviceId });

          if (device) {
            await DeviceTelemetry.create({
              device: device._id,
              company: device.company,
              data: payload,
            });
            // Update Last Seen
            device.lastSeen = Date.now();
            device.status = "online";
            await device.save();

            console.log(`📡 Telemetry saved for ${deviceId}`);
          } else {
            console.log(
              `⚠️ Telemetry received for UNKNOWN device: ${deviceId}`,
            );
          }
        } catch (err) {
          console.error("MQTT Telemetry Error:", err.message);
        }
      }
    }
  });

  return aedes;
};

module.exports = startBroker;
