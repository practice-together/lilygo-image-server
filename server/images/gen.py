from PIL import Image, ImageDraw, ImageFont
import math

def generate_modern_pixel_art(size=500, symbol="π", font_size=None, background_color="#1a1a1a", text_color="#ffffff", y_offset=0):
    """
    Generate modern-looking pixel art with a mathematical symbol.
    Parameters same as before, with added:
        y_offset (int): Vertical offset from center for fine-tuning position
    """
    if font_size is None:
        font_size = size // 2
        
    high_res_size = size * 2
    high_res_font_size = font_size * 2
    img = Image.new("RGB", (high_res_size, high_res_size), background_color)
    draw = ImageDraw.Draw(img)
    
    fonts = [
        "Arial Bold.ttf",
        "arial.ttf",
        "DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    ]
    
    font = None
    for font_path in fonts:
        try:
            font = ImageFont.truetype(font_path, high_res_font_size)
            break
        except IOError:
            continue
            
    if font is None:
        font = ImageFont.load_default()
        print("Warning: Using default font. Install Arial or DejaVuSans for better results.")

    # Improved center positioning
    bbox = draw.textbbox((0, 0), symbol, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Adjust position with precise centering and optional offset
    x = (high_res_size - text_width) // 2 - bbox[0]  # Account for any negative bbox offset
    y = (high_res_size - text_height) // 2 - bbox[1] + (y_offset * 2)  # Double offset for high res
    
    # Enhanced outline for better visibility
    outline_color = background_color
    outline_positions = [
        (-2,-2), (-2,0), (-2,2),
        (0,-2), (0,2),
        (2,-2), (2,0), (2,2)
    ]
    
    # Draw outline
    for dx, dy in outline_positions:
        draw.text((x + dx, y + dy), symbol, font=font, fill=outline_color)
    
    # Draw main text
    draw.text((x, y), symbol, font=font, fill=text_color)
    
    # Resize and apply enhanced pixelation
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    pixel_size = max(4, size // 60)  # Finer pixelation
    pixelated = img.resize((size // pixel_size, size // pixel_size), Image.Resampling.BILINEAR)
    pixelated = pixelated.resize((size, size), Image.Resampling.NEAREST)
    
    # Add enhanced texture
    final_img = Image.new("RGB", (size, size))
    for x in range(size):
        for y in range(size):
            r, g, b = pixelated.getpixel((x, y))
            noise = math.sin(x * y / 50) * 3  # More subtle noise pattern
            r = max(0, min(255, r + noise))
            g = max(0, min(255, g + noise))
            b = max(0, min(255, b + noise))
            final_img.putpixel((x, y), (int(r), int(g), int(b)))
            
    return final_img

if __name__ == "__main__":
    # 1. Vaporwave Aesthetic
    quantum_art = generate_modern_pixel_art(
        size=500,
        symbol="Ψ",
        font_size=300,
        background_color="#FF61EF",  # Bright pink
        text_color="#001B3A",        # Deep navy
        y_offset=-10
    )
    quantum_art.save("quantum_psi_art.png")
    quantum_art.show()
    
    # 2. Modern Mint
    golden_art = generate_modern_pixel_art(
        size=500,
        symbol="φ",
        font_size=350,
        background_color="#00FFB3",  # Bright mint
        text_color="#2B0D1A",        # Deep burgundy
        y_offset=-15
    )
    golden_art.save("golden_phi_art.png")
    golden_art.show()
    
    # 3. Electric Blue
    infinity_art = generate_modern_pixel_art(
        size=500,
        symbol="∞",
        font_size=300,
        background_color="#4ADFFF",  # Electric blue
        text_color="#1A0D2B",        # Deep purple
        y_offset=-20
    )
    infinity_art.save("infinity_art.png")
    infinity_art.show()
    
    # 4. Neon Orange
    delta_art = generate_modern_pixel_art(
        size=500,
        symbol="Δ",
        font_size=300,
        background_color="#FF9F1C",  # Bright orange
        text_color="#1A1A1A",        # Almost black
        y_offset=-10
    )
    delta_art.save("delta_art.png")
    delta_art.show()
    
    # 5. Electric Lime
    sigma_art = generate_modern_pixel_art(
        size=500,
        symbol="Σ",
        font_size=300,
        background_color="#CCFF00",  # Electric lime
        text_color="#2B1A0D",        # Deep brown
        y_offset=-5
    )
    sigma_art.save("sigma_art.png")
    sigma_art.show()