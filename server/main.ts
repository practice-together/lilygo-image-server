import { serve } from "bun";
import { join } from "path";
import fs from "fs";
import { PNG } from "pngjs";
import { networkInterfaces } from "os";

// Get local IP address
function getLocalIPAddress() {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost
}

// Store the currently selected image
let selectedImage = null;

// Directory where images are stored
const IMAGES_DIR = "./images";

// Get list of images from the images directory
function getImagesList() {
  return fs.readdirSync(IMAGES_DIR)
    .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
}

// Convert RGB to 16-bit color (RGB565 format)
function rgbTo16Bit(r, g, b) {
  // Ensure values are within 0-255 range
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  // Convert to 5-6-5 format
  const r5 = (r * 31 / 255) | 0;
  const g6 = (g * 63 / 255) | 0;
  const b5 = (b * 31 / 255) | 0;

  // Combine into 16-bit value
  return (r5 << 11) | (g6 << 5) | b5;
}

// Convert image to binary buffer in 16-bit format
async function convertImageToBinary(imagePath) {
  return new Promise((resolve, reject) => {
    // Create output buffer for 170x170 16-bit image
    const outputBuffer = Buffer.alloc(170 * 170 * 2);
    let outputIndex = 0;

    // Read and parse PNG
    fs.createReadStream(imagePath)
      .pipe(new PNG())
      .on('parsed', function() {
        // Create a temporary canvas for resizing
        const aspectRatio = this.width / this.height;
        let sx = 0, sy = 0, sWidth = this.width, sHeight = this.height;
        
        // Calculate source dimensions to maintain aspect ratio
        if (aspectRatio > 1) {
          sWidth = Math.round(this.height * 1);
          sx = Math.round((this.width - sWidth) / 2);
        } else if (aspectRatio < 1) {
          sHeight = Math.round(this.width * 1);
          sy = Math.round((this.height - sHeight) / 2);
        }

        // Simple nearest-neighbor scaling
        for (let y = 0; y < 170; y++) {
          for (let x = 0; x < 170; x++) {
            // Map target coordinates back to source coordinates
            const sourceX = Math.floor(sx + (x * sWidth / 170));
            const sourceY = Math.floor(sy + (y * sHeight / 170));
            
            // Get source pixel index
            const idx = (sourceY * this.width + sourceX) << 2;
            
            // Get RGB values
            const r = this.data[idx];
            const g = this.data[idx + 1];
            const b = this.data[idx + 2];
            
            // Convert to 16-bit color
            const color16bit = rgbTo16Bit(r, g, b);
            
            // Write to output buffer in little-endian format
            outputBuffer.writeUInt16LE(color16bit, outputIndex);
            outputIndex += 2;
          }
        }
        
        resolve(outputBuffer);
      })
      .on('error', reject);
  });
}

const server = serve({
  hostname: "0.0.0.0",
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    console.log(`Endpoint hit: ${req.method} ${url.pathname}${url.search}`);

    // Serve index.html
    if (url.pathname === "/") {
      const html = Bun.file("./index.html");
      return new Response(html);
    }

    // Handle server info request
    if (url.pathname === "/api/serverInfo") {
      const serverInfo = {
        ip: getLocalIPAddress(),
        port: server.port
      };
      return new Response(JSON.stringify(serverInfo), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle image list request
    if (url.pathname === "/api/images") {
      const images = getImagesList();
      return new Response(JSON.stringify(images), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle image selection
    if (url.pathname === "/api/selectImage") {
      if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      const data = await req.json();
      selectedImage = data.image;
      return new Response(JSON.stringify({ success: true }));
    }

    // Handle selected image request (for ESP32)
    if (url.pathname === "/api/imageName") {
      return new Response(selectedImage || "", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Handle image data request (for ESP32)
    if (url.pathname === "/api/imageData") {
      const imageName = url.searchParams.get("name");
      if (!imageName) {
        return new Response("Image name required", { status: 400 });
      }

      const imagePath = join(IMAGES_DIR, imageName);
      if (!fs.existsSync(imagePath)) {
        return new Response("Image not found", { status: 404 });
      }

      try {
        console.log(`Processing image: ${imagePath}`);
        const binaryData = await convertImageToBinary(imagePath);
        console.log(`Converted image size: ${binaryData.length} bytes`);
        
        return new Response(binaryData, {
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Length": binaryData.length.toString()
          }
        });
      } catch (error) {
        console.error('Image processing error:', error);
        return new Response(`Error processing image: ${error.message}`, { status: 500 });
      }
    }

    // Serve images for the web interface
    if (url.pathname.startsWith("/images/")) {
      const imageName = url.pathname.replace("/images/", "");
      const imagePath = join(IMAGES_DIR, imageName);
      if (!fs.existsSync(imagePath)) {
        return new Response("Image not found", { status: 404 });
      }
      const imageFile = Bun.file(imagePath);
      return new Response(imageFile);
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server running at http://0.0.0.0:${server.port}`);