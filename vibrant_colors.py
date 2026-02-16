#!/usr/bin/env python3
"""
Convert colors from hex to HSL and create more vibrant versions
"""

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.strip().lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hsl(r, g, b):
    """Convert RGB to HSL"""
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    max_val = max(r, g, b)
    min_val = min(r, g, b)
    diff = max_val - min_val
    
    # Lightness
    l = (max_val + min_val) / 2.0
    
    if diff == 0:
        h = s = 0  # achromatic
    else:
        # Saturation
        if l < 0.5:
            s = diff / (max_val + min_val)
        else:
            s = diff / (2.0 - max_val - min_val)
        
        # Hue
        if max_val == r:
            h = ((g - b) / diff + (6 if g < b else 0)) / 6.0
        elif max_val == g:
            h = ((b - r) / diff + 2) / 6.0
        else:
            h = ((r - g) / diff + 4) / 6.0
    
    return (h * 360, s * 100, l * 100)

def hsl_to_rgb(h, s, l):
    """Convert HSL to RGB"""
    h, s, l = h / 360.0, s / 100.0, l / 100.0
    
    if s == 0:
        r = g = b = l  # achromatic
    else:
        def hue_to_rgb(p, q, t):
            if t < 0: t += 1
            if t > 1: t -= 1
            if t < 1/6: return p + (q - p) * 6 * t
            if t < 1/2: return q
            if t < 2/3: return p + (q - p) * (2/3 - t) * 6
            return p
        
        if l < 0.5:
            q = l * (1 + s)
        else:
            q = l + s - l * s
        p = 2 * l - q
        
        r = hue_to_rgb(p, q, h + 1/3)
        g = hue_to_rgb(p, q, h)
        b = hue_to_rgb(p, q, h - 1/3)
    
    return (int(round(r * 255)), int(round(g * 255)), int(round(b * 255)))

def rgb_to_hex(r, g, b):
    """Convert RGB to hex"""
    return f"#{r:02X}{g:02X}{b:02X}"

def make_vibrant(h, s, l, saturation_boost=0.3, lightness_adjust=0.05):
    """
    Create a more vibrant version of a color
    - Increase saturation (up to 100%)
    - Slightly adjust lightness for better vibrancy
    """
    # Boost saturation, but cap at 100%
    new_s = min(100, s + (100 - s) * saturation_boost)
    
    # Adjust lightness slightly - if too dark, lighten; if too light, darken slightly
    if l < 30:
        new_l = l + abs(l * lightness_adjust)  # Lighten dark colors
    elif l > 70:
        new_l = l - abs((100 - l) * lightness_adjust)  # Darken very light colors
    else:
        new_l = l  # Keep mid-tones similar
    
    return (h, new_s, new_l)

# Original colors from the PDF
original_colors = [
    "CCA492",
    "DCC7BC",
    "7E908D",
    "664032",
    "CA8E71"
]

print("=" * 80)
print("ORIGINAL COLORS → MORE VIBRANT VERSIONS (HSL)")
print("=" * 80)
print()

for hex_color in original_colors:
    # Convert to RGB then HSL
    r, g, b = hex_to_rgb(hex_color)
    h, s, l = rgb_to_hsl(r, g, b)
    
    # Create vibrant version
    vh, vs, vl = make_vibrant(h, s, l)
    
    # Convert vibrant HSL back to hex
    vr, vg, vb = hsl_to_rgb(vh, vs, vl)
    vibrant_hex = rgb_to_hex(vr, vg, vb)
    
    print(f"Original: {hex_color}")
    print(f"  RGB: ({r:3d}, {g:3d}, {b:3d})")
    print(f"  HSL: H={h:6.1f}°  S={s:5.1f}%  L={l:5.1f}%")
    print()
    print(f"Vibrant:  {vibrant_hex.lstrip('#')}")
    print(f"  RGB: ({vr:3d}, {vg:3d}, {vb:3d})")
    print(f"  HSL: H={vh:6.1f}°  S={vs:5.1f}%  L={vl:5.1f}%")
    print()
    print("-" * 80)
    print()

print("\nColor Palette (Vibrant Versions):")
vibrant_hexes = []
for c in original_colors:
    r, g, b = hex_to_rgb(c)
    h, s, l = rgb_to_hsl(r, g, b)
    vh, vs, vl = make_vibrant(h, s, l)
    vr, vg, vb = hsl_to_rgb(vh, vs, vl)
    vibrant_hexes.append(rgb_to_hex(vr, vg, vb).lstrip('#'))
print(" ".join(vibrant_hexes))
