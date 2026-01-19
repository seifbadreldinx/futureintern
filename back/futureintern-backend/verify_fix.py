
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app import create_app, db
from app.models.application import Application
from app.models.intern import Internship

def verify():
    app = create_app()
    with app.app_context():
        apps = Application.query.all()
        broken = 0
        for a in apps:
            if not Internship.query.get(a.internship_id):
                broken += 1
        
        with open("verification_result.txt", "w") as f:
            if broken == 0:
                f.write("SUCCESS: All applications are valid.")
            else:
                f.write(f"FAILURE: Found {broken} broken applications.")

if __name__ == "__main__":
    verify()
