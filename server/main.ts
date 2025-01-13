import { serve } from "bun";
import { join } from "path";
import fs from "fs";

// Store the currently selected image
let selectedImage = null;

// Directory where images are stored
const IMAGES_DIR = "./images";

// Get list of images from the images directory
function getImagesList() {
  return fs.readdirSync(IMAGES_DIR)
    .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
}

const server = serve({
  hostname: "0.0.0.0",  // Modified this line to listen on all interfaces
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve index.html
    if (url.pathname === "/") {
      const html = Bun.file("./index.html");
      return new Response(html);
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
    if (url.pathname === "/api/selectedImage") {
      return new Response(selectedImage || "", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Handle image data request (for ESP32)
    if (url.pathname === "/api/imageData") {
      const imageName = url.searchParams.get("image");
      if (!imageName) {
        return new Response("Image name required", { status: 400 });
      }
      const imagePath = join(IMAGES_DIR, imageName);
      if (!fs.existsSync(imagePath)) {
        return new Response("Image not found", { status: 404 });
      }
      const imageFile = Bun.file(imagePath);
      return new Response(imageFile);
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