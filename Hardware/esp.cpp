#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";

const char* serverURL =
"http://YOUR_SERVER_IP:8000/api/sensors/upload";

String deviceId = "URN-001";

float calculateRisk(
  float gas,
  float water,
  float tiltX,
  float tiltY,
  float vibration
)
{
  int score = 0;

  if (gas > 300) score += 40;
  if (water > 50) score += 30;
  if (abs(tiltX) > 5) score += 15;
  if (abs(tiltY) > 5) score += 15;
  if (vibration > 20) score += 20;

  if(score > 100) score = 100;

  return score;
}

void setup() {

  Serial.begin(115200);

  randomSeed(millis());

  WiFi.begin(ssid, password);

  Serial.println("Connecting WiFi...");

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("Connected!");
  Serial.println(WiFi.localIP());
}

void loop() {

  float temperature = random(180, 420) / 10.0;
  float humidity = random(300, 900) / 10.0;

  float gas_level = random(50, 600);

  float water_level = random(0, 120);

  float tilt_x = random(-100, 100) / 10.0;
  float tilt_y = random(-100, 100) / 10.0;

  float vibration = random(0, 50);

  int risk_score = calculateRisk(
    gas_level,
    water_level,
    tilt_x,
    tilt_y,
    vibration
  );

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;

    http.begin(serverURL);

    http.addHeader("Content-Type", "application/json");

    DynamicJsonDocument doc(2048);

    doc["device_id"] = deviceId;

    doc["latitude"] =
      40.4093 + (random(-100, 100) / 10000.0);

    doc["longitude"] =
      49.8671 + (random(-100, 100) / 10000.0);

    doc["temperature"] = temperature;
    doc["humidity"] = humidity;

    doc["gas_level"] = gas_level;
    doc["water_level"] = water_level;

    doc["tilt_x"] = tilt_x;
    doc["tilt_y"] = tilt_y;

    doc["vibration"] = vibration;

    doc["risk_score"] = risk_score;

    String payload;

    serializeJson(doc, payload);

    Serial.println("Sending:");
    Serial.println(payload);

    int responseCode = http.POST(payload);

    Serial.print("HTTP Response: ");
    Serial.println(responseCode);

    http.end();
  }

  Serial.println("----------------------");

  delay(10000);
}