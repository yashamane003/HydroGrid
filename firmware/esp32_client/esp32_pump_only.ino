#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <Preferences.h>

// ======================= CONFIGURATION =======================
const char* ssid = "Top";
const char* password = "twenty20";

// Backend URL (Use your PC's IP address)
String backendIp = "192.168.2.103";
String backendPort = "5000";
String BACKEND_URL = "http://" + backendIp + ":" + backendPort;

// MQTT Settings
const int mqttPort = 1883; 
WiFiClient espClient;
PubSubClient client(espClient);

// Device Info
String deviceMac;
String deviceId;
String companyId; 
String currentToken = "";

// PINS
#define MOTOR_PIN 26

// State Machine
enum DeviceState { STATE_UNCLAIMED, STATE_PAIRING, STATE_PAIRED };
DeviceState currentState = STATE_UNCLAIMED;

// Timing
unsigned long lastPollTime = 0;
const unsigned long POLL_INTERVAL = 5000;

// ======================= FUNCTIONS =======================

String getMacAddress() {
  return WiFi.macAddress();
}

String generateToken() {
  int token = random(100000, 999999);
  return String(token);
}

void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Connecting to WiFi: "); Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
}

void checkStatus() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String url = BACKEND_URL + "/api/esp/status?mac=" + deviceMac;
  http.begin(url);
  
  int code = http.GET();
  if (code == 200) {
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, http.getString());
    String state = doc["state"].as<String>();
    
    if (state == "PAIRED") {
      currentState = STATE_PAIRED;
      deviceId = doc["deviceId"].as<String>();
      companyId = doc["company"].as<String>();
      Serial.println("PAIRED | ID: " + deviceId + " | CID: " + companyId);
    } else if (state == "PAIRING") {
      currentState = STATE_PAIRING;
      currentToken = doc["token"].as<String>();
      Serial.println("PAIRING | Token: " + currentToken);
    } else {
      currentState = STATE_UNCLAIMED;
      Serial.println("UNCLAIMED");
    }
  }
  http.end();
}

void initPairing() {
  if (WiFi.status() != WL_CONNECTED) return;
  currentToken = generateToken();
  HTTPClient http;
  http.begin(BACKEND_URL + "/api/esp/pair/init");
  http.addHeader("Content-Type", "application/json");
  String body = "{\"mac\":\"" + deviceMac + "\",\"token\":\"" + currentToken + "\"}";
  if (http.POST(body) == 200) {
    currentState = STATE_PAIRING;
    Serial.println("Pairing Initialized. Token: " + currentToken);
  }
  http.end();
}

void reconnectMqtt() {
  if (client.connected()) return;
  Serial.print("Connecting MQTT...");
  String clientId = "ESP32-" + deviceMac;
  if (client.connect(clientId.c_str())) {
    Serial.println("CONNECTED");
    String topic = "company/" + companyId + "/device/" + deviceId + "/command";
    client.subscribe(topic.c_str());
    Serial.println("Subscribed: " + topic);
  } else {
    Serial.print("FAILED [rc="); Serial.print(client.state()); Serial.println("]");
    delay(2000);
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.println("Msg: " + msg);

  StaticJsonDocument<200> doc;
  deserializeJson(doc, msg);
  const char* cmd = doc["command"];

  if (String(cmd) == "MOTOR_IN_ON") {
    digitalWrite(MOTOR_PIN, LOW); // Relay ON (Active Low)
    Serial.println("PUMP ON");
  } else if (String(cmd) == "MOTOR_IN_OFF") {
    digitalWrite(MOTOR_PIN, HIGH); // Relay OFF (Active Low)
    Serial.println("PUMP OFF");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(MOTOR_PIN, OUTPUT); 
  digitalWrite(MOTOR_PIN, HIGH); // Start with Pump OFF (Active Low)
  
  deviceMac = getMacAddress();
  randomSeed(millis());
  
  IPAddress mqttServer; mqttServer.fromString(backendIp);
  client.setServer(mqttServer, mqttPort);
  client.setCallback(mqttCallback);

  connectToWiFi();
  checkStatus();
}

void loop() {
  connectToWiFi();
  
  if (currentState != STATE_PAIRED) {
    if (millis() - lastPollTime > POLL_INTERVAL) {
      lastPollTime = millis();
      checkStatus();
      if (currentState == STATE_UNCLAIMED) initPairing();
    }
  } else {
    reconnectMqtt();
    client.loop();
  }
}
