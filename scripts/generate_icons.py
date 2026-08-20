import os
from PIL import Image, ImageOps

def generate_brand_icons():
    public_dir = os.path.join(os.path.dirname(__file__), "..", "public")
    logo_path = os.path.join(public_dir, "logo.png")
    
    if not os.path.exists(logo_path):
        print(f"Error: {logo_path} not found")
        return

    # Load transparent logo
    logo_img = Image.open(logo_path).convert("RGBA")
    bbox = logo_img.getbbox()
    if bbox:
        logo_cropped = logo_img.crop(bbox)
    else:
        logo_cropped = logo_img

    # Create master square 512x512 with transparent/white background and centered logo
    master_size = 512
    master_img = Image.new("RGBA", (master_size, master_size), (255, 255, 255, 0))
    
    # Calculate aspect ratio fitting with 12% padding for Google Search / PWA icon compliance
    target_max_dim = int(master_size * 0.82)
    w, h = logo_cropped.size
    scale = min(target_max_dim / w, target_max_dim / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    logo_resized = logo_cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Paste centered
    offset_x = (master_size - new_w) // 2
    offset_y = (master_size - new_h) // 2
    master_img.paste(logo_resized, (offset_x, offset_y), logo_resized)
    
    # Also create a crisp white background version if needed for apple-touch-icon / rich snippets
    # Google guidelines allow both transparent or solid white. Solid white is cleanest across all dark/light Google Search results.
    # Let's generate both transparent icon versions and solid white versions as appropriate.
    
    # Target sizes:
    # 1. icon-48x48.png
    # 2. icon-96x96.png
    # 3. icon-192x192.png
    # 4. pwa-192x192.png
    # 5. pwa-512x512.png
    # 6. apple-touch-icon.png (180x180)
    # 7. favicon.ico (16, 32, 48, 64)
    
    sizes = {
        "icon-48x48.png": 48,
        "icon-96x96.png": 96,
        "icon-192x192.png": 192,
        "pwa-192x192.png": 192,
        "pwa-512x512.png": 512,
    }
    
    for filename, size in sizes.items():
        out_img = master_img.resize((size, size), Image.Resampling.LANCZOS)
        out_path = os.path.join(public_dir, filename)
        out_img.save(out_path, format="PNG", optimize=True)
        print(f"Generated {filename} ({size}x{size})")

    # Apple Touch Icon: 180x180 with solid crisp white background for iOS home screen
    apple_img = Image.new("RGBA", (180, 180), (255, 255, 255, 255))
    apple_content = master_img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_img.paste(apple_content, (0, 0), apple_content)
    apple_img.convert("RGB").save(os.path.join(public_dir, "apple-touch-icon.png"), format="PNG", optimize=True)
    print("Generated apple-touch-icon.png (180x180 RGB)")

    # Favicon.ico: multi-resolution (16, 32, 48, 64)
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    ico_images = [master_img.resize(s, Image.Resampling.LANCZOS) for s in ico_sizes]
    ico_path = os.path.join(public_dir, "favicon.ico")
    ico_images[0].save(
        ico_path,
        format="ICO",
        sizes=ico_sizes,
        append_images=ico_images[1:]
    )
    print("Generated favicon.ico (multi-resolution 16, 32, 48, 64)")

if __name__ == "__main__":
    generate_brand_icons()
