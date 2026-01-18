# B:\SUT\3\project1\futureintern-backend\app\matching\service.py

from typing import List, Dict

class MatchingService:

    # وزن كل معيار بالنسبة للـ Score
    WEIGHTS = {
        'skills': 0.4,       # 40%
        'major': 0.3,        # 30%
        'location': 0.15,    # 15%
        'availability': 0.15 # 15%
    }

    def calculate_score(self, student: Dict, internship: Dict) -> Dict:
        """
        Calculates score for an internship.
        """
        details = {}

        # Parse skills if they are JSON strings
        student_skills = set(student.get('skills', []))
        
        intern_skills_raw = internship.get('required_skills', '[]')
        if isinstance(intern_skills_raw, str):
            try:
                import json
                intern_req_skills = set(json.loads(intern_skills_raw))
            except:
                intern_req_skills = set()
        else:
            intern_req_skills = set(intern_skills_raw)

        # Skills Matching
        if intern_req_skills:
            matched_skills = student_skills & intern_req_skills
            skills_score = len(matched_skills) / len(intern_req_skills)
        else:
            skills_score = 0
            
        details['skills'] = round(skills_score * self.WEIGHTS['skills'] * 100)

        # Major Matching
        # internships might use 'major' or generic match
        major_score = 1 if student.get('major') == internship.get('major') else 0
        details['major'] = round(major_score * self.WEIGHTS['major'] * 100)

        # Location Matching
        location_score = 1 if student.get('location') == internship.get('location') else 0
        details['location'] = round(location_score * self.WEIGHTS['location'] * 100)

        # Availability Matching (Simplified for now)
        # availability_score = 1 if student.get('availability') >= internship.get('required_availability') else 0
        details['availability'] = 0 # Placeholder until availability format is standardized

        # Total Score
        total_score = sum(details.values())
        details['total_score'] = round(total_score)

        return details

    def match_student(self, student: Dict, internships: List[Dict]) -> List[Dict]:
        """
        يعطي قائمة التدريبات مع الـ Scores والتفاصيل
        """
        results = []
        for internship in internships:
            score_details = self.calculate_score(student, internship)
            results.append({
                'internship_id': internship['id'],
                'score': score_details['total_score'],
                'details': score_details
            })

        # ترتيب النتائج من الأعلى للأقل
        results.sort(key=lambda x: x['score'], reverse=True)
        return results
