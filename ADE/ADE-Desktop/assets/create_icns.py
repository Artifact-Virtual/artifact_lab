#!/usr/bin/env python3
"""
Create ICNS file for macOS from PNG using PIL/Pillow
"""
import os
from PIL import Image

def create_icns():
    """Create ICNS file from PNG"""
    try:
        # Open the PNG file
        with Image.open('icon.png') as img:
            # Ensure RGBA mode
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Create iconset directory structure for ICNS
            iconset_dir = 'icon.iconset'
            if not os.path.exists(iconset_dir):
                os.makedirs(iconset_dir)
            
            # Define required sizes for ICNS
            sizes = [
                (16, 'icon_16x16.png'),
                (32, 'icon_16x16@2x.png'),
                (32, 'icon_32x32.png'),
                (64, 'icon_32x32@2x.png'),
                (128, 'icon_128x128.png'),
                (256, 'icon_128x128@2x.png'),
                (256, 'icon_256x256.png'),
                (512, 'icon_256x256@2x.png'),
                (512, 'icon_512x512.png'),
                (1024, 'icon_512x512@2x.png')
            ]
            
            # Generate all required sizes
            for size, filename in sizes:
                resized = img.resize((size, size), Image.Resampling.LANCZOS)
                resized.save(os.path.join(iconset_dir, filename))
            
            print(f"Created iconset directory with {len(sizes)} icon sizes")
            
            # Create a basic ICNS file (simplified approach)
            # On macOS, you would use: iconutil -c icns icon.iconset
            # For cross-platform, we'll create a simple fallback
            img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
            img_512.save('icon.icns', format='ICNS')
            
            print("Created icon.icns")
            return True
            
    except ImportError:
        print("PIL/Pillow not available. Creating fallback ICNS...")
        # Create a simple fallback by copying the PNG
        import shutil
        shutil.copy('icon.png', 'icon.icns')
        print("Created fallback icon.icns")
        return True
        
    except Exception as e:
        print(f"Error creating ICNS: {e}")
        return False

if __name__ == '__main__':
    create_icns()
