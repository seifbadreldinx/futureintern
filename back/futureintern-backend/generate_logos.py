"""
Generate simple logo placeholders for all companies
"""
from PIL import Image, ImageDraw, ImageFont
import os
import random

# Company list from production
companies = [
    ("Intcore", 4),
    ("e&", 5),
    ("Robotesta", 6),
    ("PwC", 7),
    ("Vodafone", 8),
    ("Paymob", 9),
    ("Milkup", 10),
    ("Unicharm", 11),
    ("Uniparticle", 12),
    ("Tips Hindawi", 13),
    ("Geidea", 14),
    ("Fawry", 15),
    ("XEFORT SOLUTIONS", 16),
    ("Cultiv Bureau", 17),
    ("SkillInfyTech", 18),
    ("CODTECH IT SOLUTIONS", 19),
    ("WeIntern", 20),
    ("Breadfast", 21),
]

# Color palettes (professional brand colors)
colors = [
    ('#2563eb', '#ffffff'),  # Blue
    ('#dc2626', '#ffffff'),  # Red
    ('#059669', '#ffffff'),  # Green
    ('#7c3aed', '#ffffff'),  # Purple
    ('#ea580c', '#ffffff'),  # Orange
    ('#0891b2', '#ffffff'),  # Cyan
    ('#db2777', '#ffffff'),  # Pink
    ('#65a30d', '#ffffff'),  # Lime
]

def get_initials(name):
    """Get company initials"""
    words = name.split()
    if len(words) >= 2:
        return (words[0][0] + words[1][0]).upper()
    return name[:2].upper()

def generate_logo(company_name, company_id, output_path):
    """Generate a simple, professional logo"""
    # Create a 512x512 image
    size = 512
    img = Image.new('RGB', (size, size), 'white')
    draw = ImageDraw.Draw(img)
    
    # Choose color based on company name hash for consistency
    color_idx = hash(company_name) % len(colors)
    bg_color, text_color = colors[color_idx]
    
    # Draw filled circle background
    margin = 50
    draw.ellipse([margin, margin, size-margin, size-margin], fill=bg_color)
    
    # Get initials
    initials = get_initials(company_name)
    
    # Try to load a font, fall back to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 200)
    except:
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 200)
        except:
            # Use default font if no TrueType fonts available
            font = ImageFont.load_default()
    
    # Calculate text position to center it
    bbox = draw.textbbox((0, 0), initials, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    text_x = (size - text_width) / 2
    text_y = (size - text_height) / 2 - 30  # Slight adjustment for visual centering
    
    # Draw text
    draw.text((text_x, text_y), initials, fill=text_color, font=font)
    
    # Save
    img.save(output_path, 'PNG', quality=95)
    print(f"✓ Generated: {output_path}")

# Generate logos
print("=== Generating Company Logos ===\n")

output_dir = os.path.dirname(__file__)
generated_count = 0

for company_name, company_id in companies:
    # Create filename (safe)
    safe_name = company_name.lower().replace(' ', '_').replace('&', 'and')
    filename = f"logo_{safe_name}.png"
    output_path = os.path.join(output_dir, filename)
    
    try:
        generate_logo(company_name, company_id, output_path)
        generated_count += 1
    except Exception as e:
        print(f"✗ Failed to generate {company_name}: {e}")

print(f"\n✅ Generated {generated_count} logos!")
print("\nNow run: .\\upload_logos.ps1")
