"""
Complete Company Logos Setup - Downloads and configures all company logos
"""
import os
import requests
from app import create_app, db
from app.models.user import User
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

def create_logo_directory():
    """Ensure logos directory exists"""
    logo_dir = os.path.join('uploads', 'logos')
    os.makedirs(logo_dir, exist_ok=True)
    return logo_dir

def create_text_logo(company_name, filename, bg_color, text_color):
    """Create a simple text-based logo"""
    # Create image
    size = (256, 256)
    image = Image.new('RGB', size, bg_color)
    draw = ImageDraw.Draw(image)
    
    # Get initials (first 2 letters)
    initials = company_name[:2].upper()
    
    # Draw text in center
    try:
        font = ImageFont.truetype("arial.ttf", 120)
    except:
        font = ImageFont.load_default()
    
    # Calculate text position to center it
    bbox = draw.textbbox((0, 0), initials, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2 - 20)
    
    draw.text(position, initials, fill=text_color, font=font)
    
    # Save
    image.save(filename)
    print(f"✓ Created logo: {filename}")

def download_or_create_logos():
    """Download logos from external sources or create them"""
    logo_dir = create_logo_directory()
    
    # Company logo configurations
    companies = {
        'weintern': {
            'name': 'WeIntern',
            'bg': '#00b4d8',
            'text': '#ffffff',
            'url': None
        },
        'uniparticle': {
            'name': 'Uniparticle',
            'bg': '#2d5016',
            'text': '#ffffff',
            'url': None
        },
        'milkup': {
            'name': 'Milkup',
            'bg': '#0ea5e9',
            'text': '#ffffff',
            'url': None
        },
        'intcore': {
            'name': 'Intcore',
            'bg': '#10b981',
            'text': '#ffffff',
            'url': None
        },
        'eand': {
            'name': 'e&',
            'bg': '#cbd5e1',
            'text': '#1e293b',
            'url': None
        },
        'robotesta': {
            'name': 'Robotesta',
            'bg': '#00d084',
            'text': '#ffffff',
            'url': None
        },
        'paymob': {
            'name': 'Paymob',
            'bg': '#2563eb',
            'text': '#ffffff',
            'url': None
        },
        'fawry': {
            'name': 'Fawry',
            'bg': '#f59e0b',
            'text': '#ffffff',
            'url': None
        },
        'vodafone': {
            'name': 'Vodafone',
            'bg': '#e60000',
            'text': '#ffffff',
            'url': None
        },
        'pwc': {
            'name': 'PwC',
            'bg': '#d04a02',
            'text': '#ffffff',
            'url': None
        },
        'unicharm': {
            'name': 'Unicharm',
            'bg': '#ff9800',
            'text': '#ffffff',
            'url': None
        },
        'tips_hindawi': {
            'name': 'Tips Hindawi',
            'bg': '#1e1e1e',
            'text': '#ff0048',
            'url': None
        },
        'cultiv_bureau': {
            'name': 'Cultiv Bureau',
            'bg': '#3b82f6',
            'text': '#ffffff',
            'url': None
        },
        'geidea': {
            'name': 'Geidea',
            'bg': '#1e293b',
            'text': '#ffffff',
            'url': None
        },
        'skilinfytech': {
            'name': 'SkilInfyTech',
            'bg': '#3b82f6',
            'text': '#ffffff',
            'url': None
        },
        'xefort_solutions': {
            'name': 'Xefort Solutions',
            'bg': '#1e293b',
            'text': '#ffffff',
            'url': None
        },
        'breadfast': {
            'name': 'Breadfast',
            'bg': '#fbbf24',
            'text': '#1e293b',
            'url': None
        },
        'codtech_it_solutions': {
            'name': 'CODTECH',
            'bg': '#06b6d4',
            'text': '#ffffff',
            'url': None
        },
    }
    
    for logo_key, config in companies.items():
        filename = os.path.join(logo_dir, f'{logo_key}.png')
        
        # Try to download from URL if provided
        if config.get('url'):
            try:
                response = requests.get(config['url'], timeout=10)
                if response.status_code == 200:
                    with open(filename, 'wb') as f:
                        f.write(response.content)
                    print(f"✓ Downloaded logo: {config['name']}")
                    continue
            except:
                pass
        
        # Create text-based logo
        create_text_logo(
            config['name'],
            filename,
            config['bg'],
            config['text']
        )

def update_database():
    """Update company logos in database"""
    app = create_app()
    
    with app.app_context():
        company_logo_map = {
            'WeIntern': '/uploads/logos/weintern.png',
            'Uniparticle': '/uploads/logos/uniparticle.png',
            'Milkup': '/uploads/logos/milkup.png',
            'Intcore': '/uploads/logos/intcore.png',
            'e&': '/uploads/logos/eand.png',
            'Robotesta': '/uploads/logos/robotesta.png',
            'Paymob': '/uploads/logos/paymob.png',
            'Fawry': '/uploads/logos/fawry.png',
            'Vodafone': '/uploads/logos/vodafone.png',
            'PwC': '/uploads/logos/pwc.png',
            'Unicharm': '/uploads/logos/unicharm.png',
            'Tips Hindawi': '/uploads/logos/tips_hindawi.png',
            'Cultiv Bureau': '/uploads/logos/cultiv_bureau.png',
            'Geidea': '/uploads/logos/geidea.png',
            'SkilInfyTech': '/uploads/logos/skilinfytech.png',
            'Xefort Solutions': '/uploads/logos/xefort_solutions.png',
            'Breadfast': '/uploads/logos/breadfast.png',
            'CODTECH IT SOLUTIONS': '/uploads/logos/codtech_it_solutions.png',
        }
        
        updated = 0
        for company_name, logo_path in company_logo_map.items():
            companies = User.query.filter(
                User.role == 'company',
                db.func.lower(User.company_name) == company_name.lower()
            ).all()
            
            for company in companies:
                company.profile_image = logo_path
                updated += 1
                print(f"✓ Updated DB: {company_name}")
        
        db.session.commit()
        print(f"\n✅ Updated {updated} companies in database")

if __name__ == "__main__":
    print("=" * 60)
    print("COMPANY LOGOS SETUP")
    print("=" * 60)
    print("\n1. Creating logo files...")
    download_or_create_logos()
    
    print("\n2. Updating database...")
    update_database()
    
    print("\n" + "=" * 60)
    print("✅ SETUP COMPLETE!")
    print("=" * 60)
