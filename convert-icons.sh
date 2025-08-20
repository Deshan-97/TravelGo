#!/bin/bash

# Script to convert SVG icons to PNG for TravelGo PWA
# Requires ImageMagick or Inkscape to be installed

echo "Converting TravelGo app icons from SVG to PNG..."

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to convert icons..."
    
    # Convert 512x512 icon
    convert public/icon.svg -resize 512x512 public/icon-512x512.png
    echo "✓ Created icon-512x512.png"
    
    # Convert 192x192 icon
    convert public/icon-192.svg -resize 192x192 public/icon-192x192.png
    echo "✓ Created icon-192x192.png"
    
    # Also create additional sizes for better PWA support
    convert public/icon.svg -resize 144x144 public/icon-144x144.png
    echo "✓ Created icon-144x144.png"
    
    convert public/icon.svg -resize 96x96 public/icon-96x96.png
    echo "✓ Created icon-96x96.png"
    
    convert public/icon.svg -resize 72x72 public/icon-72x72.png
    echo "✓ Created icon-72x72.png"
    
    convert public/icon.svg -resize 48x48 public/icon-48x48.png
    echo "✓ Created icon-48x48.png"

elif command -v inkscape &> /dev/null; then
    echo "Using Inkscape to convert icons..."
    
    # Convert 512x512 icon
    inkscape public/icon.svg --export-png=public/icon-512x512.png --export-width=512 --export-height=512
    echo "✓ Created icon-512x512.png"
    
    # Convert 192x192 icon
    inkscape public/icon-192.svg --export-png=public/icon-192x192.png --export-width=192 --export-height=192
    echo "✓ Created icon-192x192.png"

else
    echo "❌ Neither ImageMagick nor Inkscape found!"
    echo "Please install one of them:"
    echo "  Ubuntu/Debian: sudo apt install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/"
    echo ""
    echo "Alternatively, you can convert the SVG files manually using:"
    echo "- Online tools like https://convertio.co/svg-png/"
    echo "- GIMP (free)"
    echo "- Adobe Illustrator"
    echo "- Figma"
    exit 1
fi

echo ""
echo "🎉 Icon conversion complete!"
echo "Icons created in the public/ directory:"
echo "  - icon-512x512.png (for app stores and high-res displays)"
echo "  - icon-192x192.png (for PWA manifest)"
echo "  - Additional sizes for various use cases"
