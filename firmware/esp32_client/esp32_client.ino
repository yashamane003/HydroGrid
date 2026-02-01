#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==========================================
// CONFIGURATION
// ==========================================
// WiFi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API
const char* serverUrl = "http://YOUR_COMPUTER_IP:5000/api"; // Replace with your PC's IP, NOT localhost!

// Device Credentials (Get these from the Dashboard!)
const char* deviceId = "YOUR_DEVICE_ID";
const char* deviceSecret = "YOUR_DEVICE_SECRET";

// ==========================================
// GLOBALS
// ==========================================
String jwtToken = "";
unsigned long lastHeartbeat = 0;
const long heartbeatInterval = 60000; // 1 minute

// ==========================================
// FUNCTIONS
// ==========================================

void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

bool authenticate() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverUrl) + "/devices/auth");
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["deviceId"] = deviceId;
    doc["deviceSecret"] = deviceSecret;
    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode == 200) {
      String response = http.getString();
      StaticJsonDocument<500> responseDoc;
      deserializeJson(responseDoc, response);
      
      const char* token = responseDoc["token"];
      jwtToken = String(token);
      
      Serial.println("Authentication Successful!");
      Serial.print("Token: ");
      Serial.println(jwtToken);
      http.end();
      return true;
    } else {
      Serial.print("Auth Failed. Error code: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println(response);
      http.end();
      return false;
    }
  }
  return false;
}

void sendHeartbeat() {
  if (WiFi.status() == WL_CONNECTED && jwtToken != "") {
    HTTPClient http;
    http.begin(String(serverUrl) + "/devices/heartbeat");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + jwtToken);

    int httpResponseCode = http.POST("{}"); // Empty body

    if (httpResponseCode == 200) {
      Serial.println("Heartbeat sent successfully");
    } else {
      Serial.print("Heartbeat failed. Error code: ");
      Serial.println(httpResponseCode);
      // If 401, maybe token expired? specific handling could go here.
    }
    http.end();
  }
}

// ==========================================
// MAIN
// ==========================================

void setup() {
  Serial.begin(115200);
  connectToWiFi();
  
  // Keep trying to authenticate until successful
  while (!authenticate()) {
    Serial.println("Retrying authentication in 5 seconds...");
    delay(5000);
  }
}

void loop() {
  // Check if it's time for heartbeat
  unsigned long currentMillis = millis();
  if (currentMillis - lastHeartbeat >= heartbeatInterval) {
    lastHeartbeat = currentMillis;
    sendHeartbeat();
  }
  
  // Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }
}
