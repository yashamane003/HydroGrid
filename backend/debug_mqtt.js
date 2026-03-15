const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  console.log("Debugger connected.");
  client.subscribe("#");
});

client.on("message", (topic, message) => {
  if (topic.includes("telemetry") || topic.includes("command")) {
    console.log(`\n[${new Date().toLocaleTimeString()}] Topic: "${topic}"`);
    console.log(`Topic Length: ${topic.length}`);
    const parts = topic.split("/");
    console.log(`Parts count: ${parts.length}`);
    parts.forEach((p, i) =>
      console.log(`  part[${i}]: "${p}" (len: ${p.length})`),
    );

    try {
      const payload = JSON.parse(message.toString());
      console.log("Payload parsed successfully.");
    } catch (e) {
      console.log("Payload parse failed.");
    }
  }
});
