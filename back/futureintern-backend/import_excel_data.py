
import pandas as pd
import json
import os
from app import create_app, db
from app.models.intern import Internship
from app.models.user import User
from datetime import datetime, timedelta

def seed_database():
    app = create_app()
    with app.app_context():
        # recreate tables if needed to ensure schema is correct
        db.create_all()
        
        # Clear existing data
        print("Clearing existing internships...")
        Internship.query.delete()
        db.session.commit()
        
        print("Seeding database from CSV...")
        csv_path = "internships.csv"
        
        try:
            df = pd.read_csv(csv_path)
            print("Columns found:", df.columns.tolist())
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
                is_verified=True
            )
            company_user.set_password("admin123")
            db.session.add(company_user)
            db.session.commit()
            
        print(f"Using Company ID: {company_user.id}")

        # Iterate rows
        count = 0
        for index, row in df.iterrows():
            # Map CSV columns to DB fields 
            # "Company Name","Type","Location","Description","Requirements","Link","Deadline","Duration"
            
            title = row.get('Type', f"Internship {index+1}")
            company_name_csv = row.get('Company Name', "Unknown")
            desc = row.get('Description', "No description provided.")
            reqs = row.get('Requirements', "No specific requirements.")
            loc = row.get('Location', "Remote")
            duration = row.get('Duration', "3 Months")
            link = row.get('Link', "")
            
            # Use company name from CSV if possible to segregate? 
            # For now assign all to the Admin User but maybe include company name in title or description?
            # Or create a user for each company?
            # Creating a user for each company is better for "Company" field display.
            
            company_owner = company_user
            if company_name_csv and company_name_csv != "Unknown":
                # Check if company user exists, if not create
                # Simplify: just use the name for the internship record if possible, 
                # but our model links to User.
                # Let's create a User for each distinct company name to be professional.
                
                comp_email = f"info@{company_name_csv.replace(' ', '').lower()}.com"
                existing_comp = User.query.filter_by(company_name=company_name_csv).first()
                if not existing_comp:
                    existing_comp = User(
                        name=company_name_csv,
                        email=comp_email,
                        role='company',
                        company_name=company_name_csv,
                        company_location=str(loc) if loc else "Global"
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
            elif "engineer" in title_lower or "dev" in title_lower or "soft" in title_lower or "java" in title_lower or "python" in title_lower or "net" in title_lower or "it" in title_lower or "cyber" in title_lower or "stack" in title_lower: major = "Computer Science"
            elif "business" in title_lower or "analy" in title_lower: major = "Business"
            elif "data" in title_lower or "ai" in title_lower or "intell" in title_lower: major = "Data Science"
            
            # Simple keyword extraction for skills
            found_skills = []
            keywords = ["python", "java", "react", "sql", "excel", "communication", "design", "figma", "marketing", "content", "javascript", "html", "css", "node", "django", "laravel", "php", "cyber", "security", "android", "ios", "mobile", "ai", "machine learning"]
            content_to_search = (str(reqs) + " " + str(title) + " " + str(desc)).lower()
            
            for k in keywords:
                if k in content_to_search:
                    found_skills.append(k.capitalize())
            
            if not found_skills:
                if major == "Computer Science": found_skills = ["Tech Skills"]
            
            # Clean values
            def clean(val):
                return str(val).replace("-----", "").strip() if pd.notna(val) else ""

            new_intern = Internship(
                title=str(title),
                description=clean(desc) + (f"\n\nApply Link: {link}" if link else ""),
                requirements=clean(reqs),
                location=clean(loc),
                duration=clean(duration),
                stipend="Unpaid", # Default as not in CSV
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
