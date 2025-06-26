# ADE Desktop Icons

This directory contains the application icons for different platforms.

## Icon Specifications

### Windows (.ico)
- **icon.ico**: Main application icon
- Sizes: 16x16, 32x32, 48x48, 256x256
- Format: ICO with PNG compression

### macOS (.icns)
- **icon.icns**: Main application icon
- Sizes: 16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024
- Format: ICNS

### Linux (.png)
- **icon.png**: Main application icon
- Size: 512x512
- Format: PNG with transparency

## Design Guidelines

The ADE Desktop icon follows these design principles:

1. **Modern & Minimal**: Clean, geometric design with subtle gradients
2. **AMOLED Compatible**: Works well on both light and dark backgrounds
3. **Scalable**: Vector-based design that scales from 16px to 1024px
4. **Brand Consistent**: Matches the ADE Studio color scheme and branding

## Colors Used

- Primary: #00d2ff (Electric Blue)
- Secondary: #3a7bd5 (Royal Blue)
- Accent: #ffffff (White)
- Background: #000000 (AMOLED Black)

## Generating Icons

Use the following tools to generate platform-specific icons:

1. **electron-icon-builder**: `npm install -g electron-icon-builder`
2. **Create from SVG**: `electron-icon-builder --input=icon.svg --output=./`

Or use online tools like:
- https://www.electron.build/icons
- https://cloudconvert.com/svg-to-ico
- https://iconverticons.com/online/
