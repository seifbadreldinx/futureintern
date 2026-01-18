# test_matching_logic.py
from app.matching.service import MatchingService
import json

def test_matching():
    service = MatchingService()

    # Mock Data based on Notebook logic
    
    # 1. Perfect Match Case
    student_perfect = {
        "major": "Computer Science",
        "skills": ["python", "react", "sql"],
        "location": "cairo",
        # "certificate": "yes" # Simulated
    }
    
    internship_perfect = {
        "id": 1,
        "major": "Computer Science",
        "required_skills": ["python", "react"],
        "location": "cairo"
    }
    
    # Expected: 
    # Skills: 1.0 (2/2) * 0.50 = 50
    # Major: 1.0 * 0.20 = 20
    # Location: 1.0 * 0.15 = 15
    # Experience: 0.5 (default no) * 0.15 = 7.5  (Total ~92.5)

    score_perfect = service.calculate_score(student_perfect, internship_perfect)
    print(f"Perfect Match Score: {score_perfect}")

    # 2. Partial Match Case
    student_partial = {
        "major": "Engineering",
        "skills": ["java"],
        "location": "alex"
    }
    
    internship_partial = {
        "id": 2,
        "major": "Software Engineering", # 'Engineering' in 'Software Engineering' -> 0.5
        "required_skills": ["python", "java"], # 1/2 -> 0.5
        "location": "cairo" # 0
    }
    
    # Expected:
    # Skills: 0.5 * 0.50 = 25
    # Major: 0.5 * 0.20 = 10
    # Location: 0 * 0.15 = 0
    # Experience: 0.5 * 0.15 = 7.5 (Total ~42.5)
    
    score_partial = service.calculate_score(student_partial, internship_partial)
    print(f"Partial Match Score: {score_partial}")

    # 3. Hard Filter Fail Case
    student_fail = {
        "major": "Finance"
    }
    internship_fail = {
        "id": 3,
        "major": "Computer Science"
    }
    
    score_fail = service.calculate_score(student_fail, internship_fail)
    print(f"Fail Match Score: {score_fail}")

if __name__ == "__main__":
    try:
        test_matching()
        print("Test execution finished.")
    except Exception as e:
        print(f"Error during test: {e}")
