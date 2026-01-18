from typing import List, Dict
from .service import MatchingService

class RecommendationAPI:
    def __init__(self):
        self.service = MatchingService()

    def recommend(
        self,
        student: Dict,
        internships: List[Dict],
        filters: Dict = {}
    ) -> List[Dict]:
        """
        Return recommended internships with optional filters
        """
        results = self.service.match_student(student, internships)

        if filters:
            def filter_internship(item):
                internship = next(
                    (i for i in internships if i['id'] == item['internship_id']),
                    None
                )
                if not internship:
                    return False

                if 'skills' in filters and not set(filters['skills']).intersection(
                    set(internship['required_skills'])
                ):
                    return False

                if 'major' in filters and internship['major'] != filters['major']:
                    return False

                if 'location' in filters and internship['location'] != filters['location']:
                    return False

                if 'availability' in filters and student['availability'] < internship['required_availability']:
                    return False

                return True

            results = [item for item in results if filter_internship(item)]

        return results
