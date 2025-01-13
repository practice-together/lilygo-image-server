/*
    Arduino code for Lilygo T-Display-S3
*/
#include "TFT_eSPI.h"
#include "pin_config.h"
#include <WiFi.h>
#include <HTTPClient.h>

// Wi-Fi credentials
const char* ssid = "<YOUR_SSID>";
const char* password = "<YOUR_PWD>";
const char* serverBase = "http://192.168.1.156:3000"; // change this to IP of your web-server

TFT_eSPI tft = TFT_eSPI();

// Image dimensions
static const int IMG_WIDTH = 170;
static const int IMG_HEIGHT = 170;
static const size_t BUFFER_SIZE = IMG_WIDTH * 2;

// Current image tracking
String currentImageName = "";

void fetchAndDisplayImage(const String& imageName) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Wi-Fi disconnected");
        tft.println("Wi-Fi disconnected");
        return;
    }

    String imageUrl = String(serverBase) + "/api/imageData?name=" + imageName;
    HTTPClient http;
    http.useHTTP10(true);
    http.begin(imageUrl);
    
    int httpResponseCode = http.GET();
    if (httpResponseCode != HTTP_CODE_OK) {
        Serial.printf("HTTP request failed: %s\n", http.errorToString(httpResponseCode).c_str());
        tft.printf("HTTP Error: %s\n", http.errorToString(httpResponseCode).c_str());
        http.end();
        return;
    }

    WiFiClient* stream = http.getStreamPtr();
    uint8_t buffer[BUFFER_SIZE];
    uint16_t lineBuffer[IMG_WIDTH];
    int y = 0;

    tft.fillScreen(TFT_BLACK);
    tft.startWrite();

    while (y < IMG_HEIGHT && stream->available()) {
        size_t bytesRead = stream->readBytes(buffer, BUFFER_SIZE);
        if (bytesRead != BUFFER_SIZE) {
            Serial.printf("Incomplete line read: %d bytes\n", bytesRead);
            break;
        }

        for (int x = 0; x < IMG_WIDTH; x++) {
            lineBuffer[x] = (buffer[x*2] << 8) | buffer[x*2 + 1];
        }

        tft.pushImage(0, y, IMG_WIDTH, 1, lineBuffer);
        y++;

        if (y % 10 == 0) {
            yield();
        }
    }

    tft.endWrite();
    
    if (y == IMG_HEIGHT) {
        Serial.println("Image successfully displayed");
        
        // Clear the right half of the screen
        tft.fillRect(IMG_WIDTH, 0, tft.width() - IMG_WIDTH, tft.height(), TFT_BLACK);
        
        // Set text properties
        tft.setTextSize(2);  // Increased from 2 to 3
        tft.setTextColor(TFT_CYAN);  // Using cyan color - you can adjust this
        
        // Calculate vertical center position for text with new size
        int textHeight = 24;  // approximate height for text size 3
        int yPos = (tft.height() - textHeight) / 2;
        
        // Remove file extension from image name
        String displayName = imageName;
        int dotIndex = displayName.lastIndexOf('.');
        if (dotIndex != -1) {
            displayName = displayName.substring(0, dotIndex);
        }
        
        // Set text cursor with increased margin from left
        tft.setCursor(IMG_WIDTH + 15, yPos);  // Increased from 5 to 20 pixels margin
        tft.println(displayName);
        
        // Reset text size and color for other display functions
        tft.setTextSize(2);
        tft.setTextColor(TFT_WHITE);
    }

    http.end();
}

String checkImageName() {
    if (WiFi.status() != WL_CONNECTED) return "";

    HTTPClient http;
    String nameUrl = String(serverBase) + "/api/imageName";
    http.begin(nameUrl);
    
    int httpCode = http.GET();
    String newName = "";
    
    if (httpCode == HTTP_CODE_OK) {
        newName = http.getString();
        Serial.printf("Received image name: %s\n", newName.c_str());
    } else {
        Serial.printf("Failed to get image name: %d\n", httpCode);
        tft.println("Failed to get image name");
    }
    
    http.end();
    return newName;
}

void setup() {
    Serial.begin(115200);
    
    pinMode(15, OUTPUT);
    digitalWrite(15, HIGH);

    tft.init();
    tft.setRotation(1);
    tft.fillScreen(TFT_BLACK);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.setTextSize(2);

    tft.println("Connecting to Wi-Fi...");
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        tft.print(".");
    }

    Serial.println("\nWi-Fi connected!");
    tft.println("Wi-Fi connected!");
    tft.println(WiFi.localIP());

    // Initial image check
    currentImageName = checkImageName();
    if (currentImageName != "") {
        fetchAndDisplayImage(currentImageName);
    }
}

void loop() {
    // Check for new image name
    String newName = checkImageName();

    if (newName != "" && newName != currentImageName) {
        currentImageName = newName;
        fetchAndDisplayImage(currentImageName);
    }
    
    // If name is the same, wait before checking again
    delay(1000);
}