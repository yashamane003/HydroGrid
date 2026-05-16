#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <DHT.h>

Preferences preferences;

// ======================= CONFIGURATION =======================
String ssid = "Sujal";
String password = "12345678";
String backendUrl = "http://10.177.0.121:5000";

// Ensure this matches the IP of the backend
String mqttIp = "10.177.0.121"; 
const int mqttPort = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

String deviceMac;
String deviceId = "";
String companyId = "";

// ======================= MOTOR PINS =======================
#define MOTOR_IN_PIN         22
#define MOTOR_OUT_PIN        23
#define MOTOR_PH_UP_PIN      18
#define MOTOR_PH_DOWN_PIN    19
#define MOTOR_NUTRIENT_A_PIN 25
#define MOTOR_NUTRIENT_B_PIN 26

// ======================= SENSOR PINS =======================
#define TDS_PIN 35
#define PH_PIN  34
#define DHTPIN  4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

// ======================= CALIBRATION =======================
#define VREF 3.3
#define ADC_RES 4095.0
float ph_m = -6.41;
float ph_b = 18.62;

// ======================= AUTOMATION TARGETS =======================
const float TARGET_PH_MIN = 5.5;
const float TARGET_PH_MAX = 6.5;
const float TARGET_TDS_MIN = 1000.0;
const unsigned long DOSE_DURATION = 10000; // 10 seconds
const unsigned long MIX_WAIT_DURATION = 60000; // 60 seconds

// ======================= ONE-TIME CONTROL STATES =======================
enum ControlState {
  MONITOR_ONLY,
  CONTROL_PH,
  WAIT_AFTER_PH,
  CONTROL_TDS,
  WAIT_AFTER_TDS
};

ControlState controlState = MONITOR_ONLY;
unsigned long stateStartTime = 0;
bool currentlyDosing = false;

// ======================= STATES =======================
enum DeviceState { STATE_UNCLAIMED, STATE_PAIRING, STATE_PAIRED };
DeviceState currentState = STATE_UNCLAIMED;

// ======================= TIMING =======================
unsigned long lastStatusCheck = 0;
const unsigned long STATUS_INTERVAL = 5000;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 5000;

// ======================= WIFI =======================
void connectToWiFi() {
  if (ssid == "" || WiFi.status() == WL_CONNECTED) return;

  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid.c_str(), password.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Failed");
  }
}

// ======================= STATUS =======================
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
      Serial.println("Device PAIRED");
    }
  }
  http.end();
}

// ======================= MQTT CALLBACK =======================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++)
    msg += (char)payload[i];

  Serial.print("MQTT Received: ");
  Serial.println(msg);

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, msg)) return;

  String cmd = doc["command"].as<String>();

  if (cmd == "START_CONTROL") {
    if (controlState == MONITOR_ONLY) {
      Serial.println("Starting One-Time Control Cycle");
      controlState = CONTROL_PH;
      stateStartTime = millis();
      currentlyDosing = false;
    } else {
      Serial.println("Control cycle already active, ignoring START_CONTROL");
    }
  }
  else if (cmd == "MOTOR_IN_ON") { digitalWrite(MOTOR_IN_PIN, LOW); Serial.println("INLET ON"); }
  else if (cmd == "MOTOR_IN_OFF") { digitalWrite(MOTOR_IN_PIN, HIGH); Serial.println("INLET OFF"); }
  else if (cmd == "MOTOR_OUT_ON") { digitalWrite(MOTOR_OUT_PIN, LOW); Serial.println("OUTLET ON"); }
  else if (cmd == "MOTOR_OUT_OFF") { digitalWrite(MOTOR_OUT_PIN, HIGH); Serial.println("OUTLET OFF"); }
  else if (cmd == "MOTOR_PH_UP_ON") { digitalWrite(MOTOR_PH_DOWN_PIN, HIGH); digitalWrite(MOTOR_PH_UP_PIN, LOW); }
  else if (cmd == "MOTOR_PH_UP_OFF") { digitalWrite(MOTOR_PH_UP_PIN, HIGH); }
  else if (cmd == "MOTOR_PH_DOWN_ON") { digitalWrite(MOTOR_PH_UP_PIN, HIGH); digitalWrite(MOTOR_PH_DOWN_PIN, LOW); }
  else if (cmd == "MOTOR_PH_DOWN_OFF") { digitalWrite(MOTOR_PH_DOWN_PIN, HIGH); }
  else if (cmd == "MOTOR_NUTRIENT_A_ON") { digitalWrite(MOTOR_NUTRIENT_A_PIN, LOW); }
  else if (cmd == "MOTOR_NUTRIENT_A_OFF") { digitalWrite(MOTOR_NUTRIENT_A_PIN, HIGH); }
  else if (cmd == "MOTOR_NUTRIENT_B_ON") { digitalWrite(MOTOR_NUTRIENT_B_PIN, LOW); }
  else if (cmd == "MOTOR_NUTRIENT_B_OFF") { digitalWrite(MOTOR_NUTRIENT_B_PIN, HIGH); }
}

// ======================= MQTT RECONNECT =======================
void reconnectMqtt() {
  if (mqttIp == "" || companyId == "" || deviceId == "") return;
  if (client.connected()) return;

  Serial.println("Connecting MQTT...");

  IPAddress m;
  m.fromString(mqttIp);
  client.setServer(m, mqttPort);

  String clientId = "ESP32-" + deviceMac;

  if (client.connect(clientId.c_str())) {
    Serial.println("MQTT Connected");
    String topic = "company/" + companyId + "/device/" + deviceId + "/command";
    client.subscribe(topic.c_str());
    Serial.println("Subscribed to topic");
  } else {
    Serial.println("MQTT Failed");
  }
}

// ======================= TELEMETRY =======================
void handleTelemetry() {
  if (millis() - lastTelemetryTime < TELEMETRY_INTERVAL) return;
  lastTelemetryTime = millis();

  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(h) || isnan(t)) {
    t = 25;
    h = 35;
  } 

  float tdsVolt = analogRead(TDS_PIN) * (VREF / ADC_RES);
  float ec = (133.42 * pow(tdsVolt,3) - 255.86 * pow(tdsVolt,2) + 857.39 * tdsVolt);
  float tds = (ec / (1.0 + 0.02 * (t - 25.0))) * 0.5;

  float phVolt = analogRead(PH_PIN) * (VREF / ADC_RES);
  float ph = ph_m * phVolt + ph_b;

  // Placeholder for Water Level (simulate a healthy tank reading)
  float waterLevelCm = 85.0; 

  String stateStr = "MONITOR_ONLY";
  if (controlState == CONTROL_PH) stateStr = "CONTROL_PH";
  if (controlState == WAIT_AFTER_PH) stateStr = "WAIT_AFTER_PH";
  if (controlState == CONTROL_TDS) stateStr = "CONTROL_TDS";
  if (controlState == WAIT_AFTER_TDS) stateStr = "WAIT_AFTER_TDS";

  Serial.printf("State: %s | T: %.2f  H: %.2f  pH: %.2f  TDS: %.2f  W-LVL: %.1f\n", stateStr.c_str(), t, h, ph, tds, waterLevelCm);

  if (currentState == STATE_PAIRED && client.connected()) {
    StaticJsonDocument<256> doc;
    doc["ph"] = ph;
    doc["tds"] = tds;
    doc["temperature"] = t;
    doc["humidity"] = h;
    doc["waterLevelCm"] = waterLevelCm;
    doc["controlState"] = stateStr;

    String out;
    serializeJson(doc, out);

    String topic = "company/" + companyId + "/device/" + deviceId + "/telemetry";
    client.publish(topic.c_str(), out.c_str());
  }
}

// ======================= ONE-TIME CONTROL MACHINE =======================
void handleControlMachine() {
  if (controlState == MONITOR_ONLY) return;

  unsigned long elapsed = millis() - stateStartTime;

  switch (controlState) {
    case CONTROL_PH:
      if (!currentlyDosing) {
        // Step 1: Read pH. Ensure nutrient pumps are OFF to prevent interference.
        digitalWrite(MOTOR_NUTRIENT_A_PIN, HIGH);
        digitalWrite(MOTOR_NUTRIENT_B_PIN, HIGH);
        
        float phVolt = analogRead(PH_PIN) * (VREF / ADC_RES);
        float ph = ph_m * phVolt + ph_b;
        
        Serial.printf("[CONTROL] Read pH: %.2f\n", ph);

        // Step 2: Adjust if necessary
        if (ph < TARGET_PH_MIN) {
          Serial.println("[CONTROL] pH too low, dosing pH Up...");
          digitalWrite(MOTOR_PH_DOWN_PIN, HIGH);
          digitalWrite(MOTOR_PH_UP_PIN, LOW);
          currentlyDosing = true;
        } else if (ph > TARGET_PH_MAX) {
          Serial.println("[CONTROL] pH too high, dosing pH Down...");
          digitalWrite(MOTOR_PH_UP_PIN, HIGH);
          digitalWrite(MOTOR_PH_DOWN_PIN, LOW);
          currentlyDosing = true;
        } else {
          Serial.println("[CONTROL] pH is within limits, skipping dose.");
          // Skip dosing, go straight to wait
          controlState = WAIT_AFTER_PH;
          stateStartTime = millis();
        }
      } else {
        // If dosing, wait for DOSE_DURATION to complete
        if (elapsed > DOSE_DURATION) {
          digitalWrite(MOTOR_PH_UP_PIN, HIGH);
          digitalWrite(MOTOR_PH_DOWN_PIN, HIGH);
          currentlyDosing = false;
          controlState = WAIT_AFTER_PH;
          stateStartTime = millis();
          Serial.println("[CONTROL] pH dosing complete, waiting for mixing...");
        }
      }
      break;

    case WAIT_AFTER_PH:
      // Step 3: Wait 1 min for mixing
      if (elapsed > MIX_WAIT_DURATION) {
        controlState = CONTROL_TDS;
        stateStartTime = millis();
        Serial.println("[CONTROL] pH mixing complete, moving to TDS reading...");
      }
      break;

    case CONTROL_TDS:
      if (!currentlyDosing) {
        // Step 4: Read TDS. Ensure pH pumps are OFF to prevent interference.
        digitalWrite(MOTOR_PH_UP_PIN, HIGH);
        digitalWrite(MOTOR_PH_DOWN_PIN, HIGH);
        
        float tdsVolt = analogRead(TDS_PIN) * (VREF / ADC_RES);
        float t = dht.readTemperature();
        if (isnan(t)) t = 25.0;
        float ec = (133.42 * pow(tdsVolt,3) - 255.86 * pow(tdsVolt,2) + 857.39 * tdsVolt);
        float tds = (ec / (1.0 + 0.02 * (t - 25.0))) * 0.5;

        Serial.printf("[CONTROL] Read TDS: %.2f\n", tds);

        // Step 5: Adjust if necessary
        if (tds < TARGET_TDS_MIN) {
          Serial.println("[CONTROL] TDS too low, dosing Nutrients A & B...");
          digitalWrite(MOTOR_NUTRIENT_A_PIN, LOW);
          digitalWrite(MOTOR_NUTRIENT_B_PIN, LOW);
          currentlyDosing = true;
        } else {
          Serial.println("[CONTROL] TDS is within limits, skipping dose.");
          controlState = WAIT_AFTER_TDS;
          stateStartTime = millis();
        }
      } else {
        if (elapsed > DOSE_DURATION) {
          digitalWrite(MOTOR_NUTRIENT_A_PIN, HIGH);
          digitalWrite(MOTOR_NUTRIENT_B_PIN, HIGH);
          currentlyDosing = false;
          controlState = WAIT_AFTER_TDS;
          stateStartTime = millis();
          Serial.println("[CONTROL] TDS dosing complete, waiting for mixing...");
        }
      }
      break;

    case WAIT_AFTER_TDS:
      // Step 6 & 7: Wait 1 min for mixing, then return to monitor mode
      if (elapsed > MIX_WAIT_DURATION) {
        controlState = MONITOR_ONLY;
        Serial.println("[CONTROL] Cycle Complete! Returning to Monitoring Mode.");
      }
      break;
  }
}

// ======================= SETUP =======================
void setup() {
  Serial.begin(115200);
  Serial.println("\n--- SYSTEM START ---");

  pinMode(MOTOR_IN_PIN, OUTPUT);
  pinMode(MOTOR_OUT_PIN, OUTPUT);
  pinMode(MOTOR_PH_UP_PIN, OUTPUT);
  pinMode(MOTOR_PH_DOWN_PIN, OUTPUT);
  pinMode(MOTOR_NUTRIENT_A_PIN, OUTPUT);
  pinMode(MOTOR_NUTRIENT_B_PIN, OUTPUT);

  digitalWrite(MOTOR_IN_PIN, HIGH);
  digitalWrite(MOTOR_OUT_PIN, HIGH);
  digitalWrite(MOTOR_PH_UP_PIN, HIGH);
  digitalWrite(MOTOR_PH_DOWN_PIN, HIGH);
  digitalWrite(MOTOR_NUTRIENT_A_PIN, HIGH);
  digitalWrite(MOTOR_NUTRIENT_B_PIN, HIGH);

  analogReadResolution(12);
  dht.begin();

  connectToWiFi();
  deviceMac = WiFi.macAddress();

  client.setBufferSize(512);
  client.setCallback(mqttCallback);

  checkStatus();
}

// ======================= LOOP =======================
void loop() {
  connectToWiFi();

  if (currentState != STATE_PAIRED) {
    if (millis() - lastStatusCheck > STATUS_INTERVAL) {
      lastStatusCheck = millis();
      checkStatus();
    }
  } else {
    reconnectMqtt();
    client.loop();
  }

  handleControlMachine();
  handleTelemetry();
}
