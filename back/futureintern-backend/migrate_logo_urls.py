"""
Migration script to convert full logo URLs to relative paths
Run this once to fix existing logos in the database
"""
import re
from app import create_app
from app.models.user import User
from app.models import db

app = create_app()

with app.app_context():
    print("=== Migrating Logo URLs ===")
    
    # Get all users with profile images
    users = User.query.filter(User.profile_image.isnot(None)).all()
    
    print(f"Found {len(users)} users with profile images")
    
    updated_count = 0
    for user in users:
        old_url = user.profile_image
        
        # Skip if already a relative path
        if not old_url.startswith('http'):
            print(f"✓ User {user.id} already has relative path: {old_url}")
            continue
        
        # Extract the relative path from the full URL
        # Match patterns like: http://localhost:5000/uploads/logos/logo_123.png
        # or: https://domain.com/uploads/logos/logo_123.png
        match = re.search(r'/uploads/logos/(.+)$', old_url)
        
        if match:
            relative_path = f"/uploads/logos/{match.group(1)}"
            user.profile_image = relative_path
            updated_count += 1
            print(f"✓ User {user.id}: {old_url} -> {relative_path}")
        else:
            print(f"✗ User {user.id}: Could not extract path from {old_url}")
    
    if updated_count > 0:
        db.session.commit()
        print(f"\n✅ Successfully migrated {updated_count} logo URLs")
    else:
        print("\n✅ No logos needed migration")
