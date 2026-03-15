const express = require("express");
const app = express();
const port = 5001; // Use a different port to test if the machine can receive traffic

app.use((req, res) => {
  console.log(`[SNIFFER] Incoming: ${req.method} ${req.url} from ${req.ip}`);
  res.status(200).send("OK");
});

app.listen(port, "0.0.0.0", () => {
  console.log(
    `Sniffer running on port ${port}. Ask user to try http://<IP>:${port}/test`,
  );
});
