"""
Create an admin user for the FutureIntern platform
Run this script to create or update the admin account
"""
from app import create_app, db
from app.models.user import User

def create_admin_user():
    app = create_app()
    
    with app.app_context():
        # Check if admin user already exists
        admin_email = "admin@futureintern.com"
        admin = User.query.filter_by(email=admin_email).first()
        
        if admin:
            # Update existing user to admin role
            admin.role = "admin"
            admin.name = "Admin"
            admin.set_password("admin123")
            db.session.commit()
            print(f"✅ Updated existing user to admin role")
        else:
            # Create new admin user
            admin = User(
                name="Admin",
                email=admin_email,
                role="admin"
            )
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
            print(f"✅ Created new admin user")
        
        print(f"\n📧 Email: {admin_email}")
        print(f"🔑 Password: admin123")
        print(f"\nYou can now login to the admin dashboard at /admin")
        print(f"\n⚠️  IMPORTANT: Change the password after first login!")

if __name__ == "__main__":
    create_admin_user()
