"""
Update company logos in the database
Run this script to add real company logos to the companies
"""
from app import create_app, db
from app.models.user import User

def update_company_logos():
    app = create_app()
    
    with app.app_context():
        # Map of company names to their logo URLs (you can use external URLs or local paths)
        company_logos = {
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
        
        # Update each company
        updated_count = 0
        for company_name, logo_path in company_logos.items():
            # Find company by company_name field
            companies = User.query.filter_by(role='company', company_name=company_name).all()
            
            if companies:
                for company in companies:
                    company.profile_image = logo_path
                    updated_count += 1
                    print(f"✓ Updated logo for: {company_name}")
            else:
                # Try case-insensitive search
                companies = User.query.filter(
                    User.role == 'company',
                    db.func.lower(User.company_name) == company_name.lower()
                ).all()
                
                if companies:
                    for company in companies:
                        company.profile_image = logo_path
                        updated_count += 1
                        print(f"✓ Updated logo for: {company_name}")
                else:
                    print(f"✗ Company not found: {company_name}")
        
        db.session.commit()
        print(f"\n✅ Updated {updated_count} company logos successfully!")
        print("\nNow place the actual logo images in: back/futureintern-backend/uploads/logos/")
        print("Logo files needed:")
        for company_name, logo_path in company_logos.items():
            filename = logo_path.split('/')[-1]
            print(f"  - {filename}")

if __name__ == "__main__":
    update_company_logos()
