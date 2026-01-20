"""
ONE-TIME MIGRATION: Fix logo paths and clean up non-existent files
Run this script ONCE on production to fix logo paths
"""
import re
import os
from app import create_app
from app.models.user import User
from app.models import db

app = create_app()

with app.app_context():
    print("=== Logo Path Migration & Cleanup ===\n")
    
    # 1. Ensure logos directory exists
    logos_dir = os.path.join(app.root_path, '..', 'uploads', 'logos')
    os.makedirs(logos_dir, exist_ok=True)
    print(f"✓ Logos directory: {logos_dir}\n")
    
    # 2. Get all companies with logos
    companies = User.query.filter(User.profile_image.isnot(None)).filter_by(role='company').all()
    
    print(f"Found {len(companies)} companies with profile images\n")
    
    fixed_count = 0
    cleaned_count = 0
    
    for company in companies:
        old_path = company.profile_image
        logo_path = old_path
        
        # Step 1: Fix path format
        if old_path.startswith('/logos/'):
            # Fix old format: /logos/xxx.jpg -> /uploads/logos/xxx.jpg
            logo_path = old_path.replace('/logos/', '/uploads/logos/')
            company.profile_image = logo_path
            fixed_count += 1
            print(f"✓ Fixed path for {company.company_name or company.name}: {old_path} -> {logo_path}")
        elif old_path.startswith('http'):
            # Extract relative path from full URLs
            match = re.search(r'/uploads/logos/(.+)$', old_path)
            if match:
                logo_path = f"/uploads/logos/{match.group(1)}"
                company.profile_image = logo_path
                fixed_count += 1
                print(f"✓ Converted URL for {company.company_name or company.name}: {old_path} -> {logo_path}")
        
        # Step 2: Check if file exists
        if logo_path.startswith('/uploads/logos/'):
            filename = logo_path.replace('/uploads/logos/', '')
            file_path = os.path.join(logos_dir, filename)
            
            if not os.path.exists(file_path):
                print(f"✗ File not found for {company.company_name or company.name}: {filename} - clearing")
                company.profile_image = None
                cleaned_count += 1
    
    # Commit changes
    if fixed_count > 0 or cleaned_count > 0:
        db.session.commit()
        print(f"\n✅ Migration complete:")
        print(f"   - Fixed {fixed_count} paths")
        print(f"   - Cleaned {cleaned_count} non-existent files")
        if cleaned_count > 0:
            print(f"\n⚠️  Companies need to re-upload their logos")
    else:
        print("\n✅ No migration needed")
