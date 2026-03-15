const axios = require("axios");

const testOff = async () => {
  try {
    const loginRes = await axios.post("http://localhost:5000/api/users/login", {
      email: "admin@example.com",
      password: "password123",
    });
    const token = loginRes.data.token;

    const devRes = await axios.get("http://localhost:5000/api/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const deviceId = devRes.data[0]._id;
    console.log(`Sending OFF command to device ${deviceId}...`);

    const res = await axios.post(
      `http://localhost:5000/api/devices/${deviceId}/motor/in/off`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log("Response:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
};

testOff();
