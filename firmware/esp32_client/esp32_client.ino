#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>    // Install "ArduinoJson"
#include <PubSubClient.h>   // Install "PubSubClient"
#include <Preferences.h>
#include <DHT.h>            // Install "DHT sensor library"

Preferences preferences;

// ======================= CONFIGURATION =======================
String ssid = "";
String password = "";
String backendUrl = ""; 

// MQTT Settings
String mqttIp = "";
const int mqttPort = 1883; 
WiFiClient espClient;
PubSubClient client(espClient);

// Device Info
String deviceMac;
String deviceId = "";
String companyId = ""; 
String currentToken = "";

// PINS
#define MOTOR_IN_PIN 26
#define MOTOR_OUT_PIN 27
#define TDS_PIN 35
#define PH_PIN  34
#define DHTPIN  4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

// SENSOR CALIBRATION
#define VREF 3.3
#define ADC_RES 4095.0
float ph_m = -6.41;
float ph_b = 18.62;

// STATES
enum DeviceState { STATE_UNCLAIMED, STATE_PAIRING, STATE_PAIRED };
DeviceState currentState = STATE_UNCLAIMED;

// TIMING
unsigned long lastStatusCheck = 0;
const unsigned long STATUS_INTERVAL = 5000;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 5000; 

// ======================= FUNCTIONS =======================

void loadConfig() {
  preferences.begin("esp-config", true);
  String s = preferences.getString("ssid", "");
  String p = preferences.getString("pass", "");
  String u = preferences.getString("url", "");
  preferences.end();
  
  // Only overwrite if we found something in memory
  if (s != "") ssid = s;
  if (p != "") password = p;
  if (u != "") backendUrl = u;

  if (backendUrl != "") {
    int start = backendUrl.indexOf("//") + 2;
    int end = backendUrl.lastIndexOf(":");
    if (end > start) mqttIp = backendUrl.substring(start, end);
    else mqttIp = backendUrl.substring(start);
  }
  Serial.println("Final Config: SSID=" + ssid + ", URL=" + backendUrl);
}

void saveConfig(String newSsid, String newPass, String newUrl) {
  preferences.begin("esp-config", false);
  preferences.putString("ssid", newSsid);
  preferences.putString("pass", newPass);
  preferences.putString("url", newUrl);
  preferences.end();
  Serial.println("Config Saved! Restarting...");
  delay(1000);
  ESP.restart();
}

void checkSerialCommands() {
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    // Simple Manual Debug Commands
    if (input == "ON") {
      digitalWrite(MOTOR_IN_PIN, LOW);
      Serial.println(">>> Manual Trigger: ON (Pin 26 LOW)");
      return;
    }
    if (input == "OFF") {
      digitalWrite(MOTOR_IN_PIN, HIGH);
      Serial.println(">>> Manual Trigger: OFF (Pin 26 HIGH)");
      return;
    }

    if (input.startsWith("{")) {
      DynamicJsonDocument doc(512);
      if (!deserializeJson(doc, input)) {
        String cmd = doc["cmd"];
        if (cmd == "SET_CONFIG") {
            saveConfig(doc["ssid"], doc["pass"], doc["url"]);
        } else if (cmd == "GET_INFO") {
            Serial.println("{\"mac\":\"" + WiFi.macAddress() + "\"}");
        }
      }
    }
  }
}

void connectToWiFi() {
  if (ssid == "" || WiFi.status() == WL_CONNECTED) return;
  Serial.print("Connecting to WiFi: " + ssid);
  WiFi.begin(ssid.c_str(), password.c_str());
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500); Serial.print(".");
    checkSerialCommands();
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi Failed.");
  }
}

void checkStatus() {
  if (WiFi.status() != WL_CONNECTED || backendUrl == "") return;
  HTTPClient http;
  http.begin(backendUrl + "/api/esp/status?mac=" + deviceMac);
  int code = http.GET();
  if (code == 200) {
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, http.getString());
    String state = doc["state"].as<String>();
    if (state == "PAIRED") {
      currentState = STATE_PAIRED;
      deviceId = doc["deviceId"].as<String>();
      companyId = doc["company"].as<String>();
      Serial.println("PAIRED | CID:" + companyId + " | DID:" + deviceId);
    } else if (state == "PAIRING") {
      currentState = STATE_PAIRING;
      currentToken = doc["token"].as<String>();
      Serial.println("PAIRING | Token:" + currentToken);
    } else {
      currentState = STATE_UNCLAIMED;
      Serial.println("UNCLAIMED (New/Reset)");
    }
  } else {
    Serial.print("Status check error code: ");
    Serial.println(code);
  }
  http.end();
}

void initPairing() {
  if (WiFi.status() != WL_CONNECTED || backendUrl == "") return;
  currentToken = String(random(100000, 999999));
  HTTPClient http;
  http.begin(backendUrl + "/api/esp/pair/init");
  http.addHeader("Content-Type", "application/json");
  String body = "{\"mac\":\"" + deviceMac + "\",\"token\":\"" + currentToken + "\"}";
  if (http.POST(body) == 200) {
    currentState = STATE_PAIRING;
    Serial.println("Sent Pairing Token: " + currentToken);
  }
  http.end();
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.print("MQTT Received ["); Serial.print(topic); Serial.print("]: "); Serial.println(msg);

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, msg);
  if (error) {
    Serial.print("JSON Parse Failed: "); Serial.println(error.c_str());
    return;
  }

  const char* cmd = doc["command"];
  if (cmd == NULL) return;

  if (String(cmd) == "MOTOR_IN_ON") {
    digitalWrite(MOTOR_IN_PIN, LOW);
    Serial.println(">>> Physical Action: MOTOR_IN PIN 26 -> LOW (ON)");
  } else if (String(cmd) == "MOTOR_IN_OFF") {
    digitalWrite(MOTOR_IN_PIN, HIGH);
    Serial.println(">>> Physical Action: MOTOR_IN PIN 26 -> HIGH (OFF)");
  } else if (String(cmd) == "MOTOR_OUT_ON") {
    digitalWrite(MOTOR_OUT_PIN, LOW);
    Serial.println(">>> Physical Action: MOTOR_OUT PIN 27 -> LOW (ON)");
  } else if (String(cmd) == "MOTOR_OUT_OFF") {
    digitalWrite(MOTOR_OUT_PIN, HIGH);
    Serial.println(">>> Physical Action: MOTOR_OUT PIN 27 -> HIGH (OFF)");
  }
}

void reconnectMqtt() {
  if (mqttIp == "" || companyId == "" || deviceId == "") {
    return;
  }
  if (!client.connected()) {
    Serial.print("Connecting MQTT to " + mqttIp + "...");
    String clientId = "ESP32-" + deviceMac;
    if (client.connect(clientId.c_str())) {
      String topic = "company/" + companyId + "/device/" + deviceId + "/command";
      client.subscribe(topic.c_str());
      Serial.println("CONNECTED");
    } else {
      Serial.print("FAILED [rc=");
      Serial.print(client.state());
      Serial.println("]");
      delay(5000);
    }
  }
}

void handleTelemetry() {
  if (millis() - lastTelemetryTime < TELEMETRY_INTERVAL) return;
  lastTelemetryTime = millis();

  // Read Sensors
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t)) t = 25.0; 
  float tdsVolt = analogRead(TDS_PIN) * (VREF / ADC_RES);
  float ec = (133.42 * pow(tdsVolt,3) - 255.86 * pow(tdsVolt,2) + 857.39 * tdsVolt);
  float tds = (ec / (1.0 + 0.02 * (t - 25.0))) * 0.5;
  float phVolt = analogRead(PH_PIN) * (VREF / ADC_RES);
  float ph = ph_m * phVolt + ph_b;

  // Print to Serial REGARDLESS of anything (Best for debugging)
  Serial.printf("Sensors -> T:%.1f H:%.1f pH:%.2f TDS:%.0f\n", t, h, ph, tds);

  // Send to MQTT only if PAIRED and CONNECTED
  if (currentState == STATE_PAIRED && client.connected()) {
    StaticJsonDocument<256> doc;
    doc["ph"] = ph;
    doc["tds"] = tds;
    doc["temperature"] = t;
    doc["humidity"] = h;
    String out;
    serializeJson(doc, out);
    String topic = "company/" + companyId + "/device/" + deviceId + "/telemetry";
    client.publish(topic.c_str(), out.c_str());
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- ESP32 STARTUP ---");

  // Robust Pin Setup
  pinMode(MOTOR_IN_PIN, OUTPUT); 
  pinMode(MOTOR_OUT_PIN, OUTPUT);
  
  // STARTUP TEST: Blink the relay once to verify hardware
  Serial.println(">>> Hardware Test: Blinking Pump Pin 26 for 1 second...");
  digitalWrite(MOTOR_IN_PIN, LOW);   // ON
  delay(1000);
  digitalWrite(MOTOR_IN_PIN, HIGH);  // OFF
  Serial.println(">>> Startup Blink Complete.");

  analogReadResolution(12);
  dht.begin();
  loadConfig();
  connectToWiFi();
  deviceMac = WiFi.macAddress();
  
  if (mqttIp != "") {
    IPAddress m; m.fromString(mqttIp);
    client.setServer(m, mqttPort);
    client.setCallback(mqttCallback);
  }
  checkStatus();
}

void loop() {
  checkSerialCommands(); 
  connectToWiFi();
  
  if (currentState != STATE_PAIRED) {
    if (millis() - lastStatusCheck > STATUS_INTERVAL) {
      lastStatusCheck = millis();
      checkStatus();
      if (currentState == STATE_UNCLAIMED) initPairing();
    }
  } else {
    reconnectMqtt();
    client.loop();
  }
  
  // ALWAYS handle telemetry (prints to serial)
  handleTelemetry();
}
