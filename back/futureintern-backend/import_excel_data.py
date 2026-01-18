
import csv
import json
import os
from app import create_app, db
from app.models.intern import Internship
from app.models.user import User
from datetime import datetime, timedelta
import re
from urllib.parse import unquote

def seed_database():
    app = create_app()
    with app.app_context():
        # recreate tables if needed to ensure schema is correct
        # Drop to enforce schema update
        db.drop_all() 
        db.create_all()
        
        # Clear existing data
        print("Clearing existing internships...")
        Internship.query.delete()
        db.session.commit()
        
        print("Seeding database from CSV...")
        csv_path = "internships.csv"
        
        if not os.path.exists(csv_path):
            print(f"Error: {csv_path} not found.")
            return

        rows = []
        try:
            with open(csv_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                print("Columns found:", reader.fieldnames)
                rows = list(reader)
        except Exception as e:
            print(f"Error reading CSV: {e}")
            return

        # Ensure Admin Company Exists
        company_user = User.query.filter_by(email="admin@futureintern.com").first()
        if not company_user:
            company_user = User(
                name="FutureIntern Admin",
                email="admin@futureintern.com",
                role="company",
                company_name="FutureIntern Partner Network",
                company_description="Various opportunities from our network.",
                company_location="Global",
                is_verified=True,
                profile_image="https://logo.clearbit.com/futureintern.com"
            )
            company_user.set_password("admin123")
            db.session.add(company_user)
            db.session.commit()
            
        print(f"Using Company ID: {company_user.id}")

        # Iterate rows
        count = 0
        for index, row in enumerate(rows):
            # Clean values helper
            def clean(val):
                if not val or val == "-----":
                    return ""
                # Convert to string, URL decode, and strip whitespace
                val_str = unquote(str(val))
                return val_str.strip()

            title_raw = row.get('Type', f"Internship {index+1}")
            # Remove leading numbering if present (e.g. "1. Title")
            title = re.sub(r'^\d+\.\s*', '', clean(title_raw))
            
            company_name_csv = clean(row.get('Company Name', "Unknown"))
            desc = clean(row.get('Description', "No description provided."))
            reqs = clean(row.get('Requirements', "No specific requirements."))
            loc = clean(row.get('Location', "Remote"))
            duration = clean(row.get('Duration', "3 Months"))
            link = clean(row.get('Link', ""))
            
            # Use company name from CSV if possible to segregate
            company_owner = company_user
            if company_name_csv and company_name_csv != "Unknown":
                # Create rudimentary email
                safe_name = re.sub(r'[^a-zA-Z0-9]', '', company_name_csv).lower()
                comp_email = f"info@{safe_name}.com"
                
                existing_comp = User.query.filter_by(company_name=company_name_csv).first()
                if not existing_comp:
                    existing_comp = User(
                        name=company_name_csv,
                        email=comp_email,
                        role='company',
                        company_name=company_name_csv,
                        company_location=loc or "Global",
                        profile_image=f"https://logo.clearbit.com/{safe_name}.com"
                    )
                    existing_comp.set_password("company123") # Default password
                    db.session.add(existing_comp)
                    db.session.commit()
                company_owner = existing_comp

            # Inference for Major and Skills
            major = "General"
            title_lower = str(title).lower()
            if "market" in title_lower: major = "Marketing"
            elif "design" in title_lower or "ui" in title_lower or "front" in title_lower: major = "Design"
            elif "engineer" in title_lower or "dev" in title_lower or "soft" in title_lower or "java" in title_lower or "python" in title_lower: major = "Computer Science"
            elif "business" in title_lower or "analy" in title_lower: major = "Business"
            elif "data" in title_lower or "ai" in title_lower: major = "Data Science"
            
            # Skills
            found_skills = []
            keywords = ["python", "java", "react", "sql", "excel", "communication", "design", "figma", "marketing", "javascript", "html", "css", "node", "php"]
            content_to_search = (str(reqs) + " " + str(title) + " " + str(desc)).lower()
            
            for k in keywords:
                if k in content_to_search:
                    found_skills.append(k.capitalize())
            
            if not found_skills:
                if major == "Computer Science": found_skills = ["Tech Skills"]

            new_intern = Internship(
                title=str(title),
                description=clean(desc) + (f"\n\nApply Link: {link}" if link else ""),
                requirements=clean(reqs),
                location=clean(loc),
                duration=clean(duration),
                stipend="Unpaid", 
                company_id=company_owner.id,
                major=major,
                required_skills=json.dumps(found_skills),
                application_deadline=datetime.utcnow() + timedelta(days=30),
                start_date=datetime.utcnow() + timedelta(days=60),
                is_active=True
            )
            db.session.add(new_intern)
            count += 1
        
        db.session.commit()
        print(f"Successfully added {count} internships from CSV!")

if __name__ == "__main__":
    seed_database()
