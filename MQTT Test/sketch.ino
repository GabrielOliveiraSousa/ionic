#include <WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MQTT Broker settings
const char* mqtt_server = "test.mosquitto.org";
const int mqtt_port = 1883;
const char* mqtt_user = "";
const char* mqtt_password = "";

// MQTT Topics
const char* topic_led = "wokwi/esp32/led/control";
const char* topic_temperature = "wokwi/esp32/temperature";

// Pinos
const int LED_PIN = 23;
const int THERMISTOR_PIN = 35;

// Calculo de temperatura
const float BETA = 3950;

WiFiClient espClient;
PubSubClient client(espClient);

bool mqttConnected = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n========================================");
  Serial.println("ESP32 MQTT Temperature Monitor");
  Serial.println("========================================\n");
  
  // Setup pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(THERMISTOR_PIN, INPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Conectar ao WiFi
  setup_wifi();
  
  // Setup MQTT
  if (WiFi.status() == WL_CONNECTED) {
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
    reconnect();
  }
}

void setup_wifi() {
  delay(10);
  Serial.println("----------------------------------------");
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✓ WiFi connected successfully!");
    Serial.print("  IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("✗ WiFi connection FAILED!");
  }
  Serial.println("----------------------------------------\n");
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial. println("\n>>> MQTT Message Received <<<");
  Serial.print("  Topic: ");
  Serial.println(topic);
  Serial.print("  Payload: ");
  Serial.println(message);
  
  // Controlar LED
  if (String(topic) == topic_led) {
    if (message == "ON" || message == "1") {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("  ✓ LED turned ON");
    } else if (message == "OFF" || message == "0") {
      digitalWrite(LED_PIN, LOW);
      Serial.println("  ✓ LED turned OFF");
    }
  }
  Serial.println();
}

void reconnect() {
  int attempts = 0;
  Serial.println("----------------------------------------");
  
  while (!client.connected() && attempts < 3) {
    Serial.print("Attempting MQTT connection ");
    Serial.print(attempts + 1);
    Serial.println("/3.. .");
    
    String clientId = "WokwiESP32-";
    clientId += String(random(0xffff), HEX);
    
    Serial.print("  Broker: ");
    Serial.print(mqtt_server);
    Serial.print(":");
    Serial.println(mqtt_port);
    Serial.print("  Client ID: ");
    Serial.println(clientId);
    
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println("✓ MQTT connected successfully!");
      
      client.subscribe(topic_led);
      Serial.print("✓ Subscribed to: ");
      Serial.println(topic_led);
      
      mqttConnected = true;
      Serial.println("----------------------------------------\n");
      return;
    } else {
      Serial.print("✗ Failed, rc=");
      Serial.print(client.state());
      
      switch(client.state()) {
        case -4: Serial. println(" (Connection timeout)"); break;
        case -3: Serial.println(" (Connection lost)"); break;
        case -2: Serial.println(" (Connect failed)"); break;
        case -1: Serial. println(" (Disconnected)"); break;
        case 1: Serial.println(" (Bad protocol)"); break;
        case 2: Serial.println(" (Bad client ID)"); break;
        case 3: Serial.println(" (Unavailable)"); break;
        case 4: Serial.println(" (Bad credentials)"); break;
        case 5: Serial. println(" (Unauthorized)"); break;
      }
      
      attempts++;
      if (attempts < 3) {
        Serial.println("  Retrying in 3 seconds...");
        delay(3000);
      }
    }
  }
  
  if (!client.connected()) {
    Serial.println("✗ MQTT connection failed after 3 attempts");
    Serial.println("  Continuing without MQTT (local mode)...");
    mqttConnected = false;
  }
  Serial.println("----------------------------------------\n");
}

float readTemperature() {
  int analogValue = analogRead(THERMISTOR_PIN);
  float celsius = 1 / (log(1 / (1023. / analogValue - 1)) / BETA + 1.0 / 298.15) - 273.15;
  return celsius;
}

void loop() {
  
  if (! client.connected()) {
    static unsigned long lastReconnectAttempt = 0;
    unsigned long now = millis();
    
    if (now - lastReconnectAttempt > 30000) { // Try every 30 seconds
      lastReconnectAttempt = now;
      reconnect();
    }
  } else {
    client.loop();
  }
  
  
  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  
  if (now - lastMsg > 2000) {
    lastMsg = now;
    
    float temperature = readTemperature();
    String tempString = String(temperature, 1);
    
    Serial.print("Temperature: ");
    Serial.print(tempString);
    Serial.println(" °C");
    
    
    if (client.connected()) {
      if (client.publish(topic_temperature, tempString.c_str())) {
        Serial.println("  ✓ Published to MQTT");
      } else {
        Serial.println("  ✗ Publish failed");
      }
    } else {
      Serial.println("  (MQTT not connected - local only)");
    }
    Serial.println();
  }
  
  delay(10);
}
