"""
Upload logos to companies
Run this with the logo files in the same directory
"""
from app import create_app
from app.models.user import User
from app.models import db
import os
import shutil

app = create_app()

# Logo mappings (filename -> company identifier)
# You need to place the logo files in this directory first
LOGO_MAPPINGS = {
    'logo_abstract.jpg': 'weintern',  # Change company name as needed
    'logo_weintern.jpg': 'weintern',
    'logo_skillnfytech.jpg': 'skillnfytech',
    'logo_tips_hindawi.png': 'tips hindawi',
    'logo_effort.jpg': 'effort solutions',
}

with app.app_context():
    print("=== Uploading Company Logos ===\n")
    
    logos_dir = os.path.join(app.root_path, '..', 'uploads', 'logos')
    os.makedirs(logos_dir, exist_ok=True)
    
    # List all companies to help with mapping
    companies = User.query.filter_by(role='company').all()
    print(f"Found {len(companies)} companies:\n")
    for c in companies[:20]:
        print(f"  - {c.company_name or c.name} (ID: {c.id})")
    
    print("\n" + "="*50)
    print("To upload logos:")
    print("1. Save the logo images with these names:")
    for filename in LOGO_MAPPINGS.keys():
        print(f"   - {filename}")
    print("2. Place them in: " + os.path.dirname(__file__))
    print("3. Update LOGO_MAPPINGS with correct company names")
    print("4. Run this script again")
    print("="*50)
