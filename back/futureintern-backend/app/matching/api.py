from typing import List, Dict
from .service import HybridMatcher

class RecommendationAPI:
    def recommend(
        self,
        student: Dict,
        internships: List[Dict],
        filters: Dict = {},
        top_k: int = 10,
    ) -> List[Dict]:
        """
        Return recommended internships with optional post-filters.
        Uses HybridMatcher (TF-IDF 30% + SBERT 70%).

        Each result dict includes:
          - match_score   : float 0-100
          - match_rank    : int
          - tfidf_score   : float 0-100
          - sbert_score   : float 0-100
          - explanation   : {
                matched_skills   : List[str],
                matched_interests: List[str],
                major_match      : bool,
                top_keywords     : List[str],
                reasons          : List[str],   # human-readable XAI reasons
            }
          - (all other internship fields)
        """
        matcher = HybridMatcher()
        matcher.fit(internships)
        results = matcher.match(student, top_k=top_k)

        if filters:
            internship_map = {i['id']: i for i in internships}

            def passes_filters(match):
                intern = internship_map.get(match['id'])
                if not intern:
                    return False
                if 'skills' in filters and not set(filters['skills']).intersection(
                    set(intern.get('skills', '').split())
                ):
                    return False
                if 'major' in filters and intern.get('major') != filters['major']:
                    return False
                if 'location' in filters and intern.get('location') != filters['location']:
                    return False
                return True

            results = [r for r in results if passes_filters(r)]

        return results
