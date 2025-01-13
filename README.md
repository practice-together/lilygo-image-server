# Lilygo T-Display-S3 Image Viewer

A web-based image management system for the Lilygo T-Display-S3 ESP32 development board. This project allows you to select and display images on the T-Display-S3's screen through a web interface.

## Overview

The project consists of two main components:
1. A Bun.ts web server that hosts the image library and handles image processing
2. Arduino code for the Lilygo T-Display-S3 that displays the selected images

### Web Server Features

- **Image Library Management**: Web interface to view and select images
- **Real-time Updates**: Images are immediately pushed to connected devices
- **Image Processing**: Automatically resizes and converts images to the correct format (RGB565) for the T-Display-S3
- **RESTful API**: Simple endpoints for device communication
  - `/api/images` - List available images
  - `/api/selectImage` - Select an image to display
  - `/api/imageName` - Get currently selected image
  - `/api/imageData` - Get processed image data

### T-Display-S3 Features

- **WiFi Connectivity**: Automatically connects to specified network
- **Image Display**: Shows 170x170 pixel images on the TFT display
- **Auto-Updates**: Polls server for new image selections
- **Reset Button**: Hardware button to restart the device
- **Status Display**: Shows connection status and current image name

## Setup

1. **Server Setup**
   ```bash
   # Install dependencies
   bun install

   # Start the server
   bun run main.ts
   ```

2. **Arduino Setup**

Note: it is assumed that you can setup an ESP32 Adruino project on your own.

   - Configure WiFi credentials in `main.cpp`
   - Update server address in `main.cpp` (IP of your device running the bun server)
   - Flash to your T-Display-S3

## How It Works

### Server-side Image Processing

The server processes images in several steps:
1. Reads the original image file
2. Resizes to 170x170 pixels while maintaining aspect ratio
3. Converts RGB colors to RGB565 format (16-bit color)
4. Sends binary data to the device

### Device Communication Flow

1. Device connects to WiFi and establishes connection with server
2. Periodically checks for newly selected images
3. When new image is selected:
   - Downloads processed image data
   - Writes data directly to TFT display
   - Updates displayed image name

### Web Interface

The web interface provides:
- Grid view of available images
- Click-to-select functionality
- Real-time selection feedback
- Server connection information
- API endpoint documentation

## Technical Details

### Display Specifications
- Resolution: 170x170 pixels
- Color Format: RGB565 (16-bit color)
- Communication: SPI

### Data Format
- Images are transferred as raw binary data
- Each pixel is 16 bits (RGB565 format)
- Data is sent in little-endian format

## Notes

- The T-Display-S3 must be connected to the same network as the server
- Images are polled every second for updates
- The reset button can be used to restart the device if needed
- Server address must be configured in the Arduino code before flashing

## Requirements

### Server
- Bun runtime
- PNG.js for image processing

### Device
- Lilygo T-Display-S3
- Arduino IDE with ESP32 support
- WiFi network access

## Contributing

Feel free to submit issues and enhancement requests!