import pandas as pd

class MatchingLoader:
    def __init__(self, path=r"C:\Users\HP\Downloads\final_matching_results.csv"):
        self.path = path
        self.df = pd.read_csv(self.path)

    def get_student_matches(self, student_email, min_score=0, limit=10):
        # تصفية الـ matches الخاصة بالطالب
        matches = self.df[self.df['student_email'] == student_email]
        matches = matches[matches['match_score'] >= min_score]
        matches = matches.sort_values(by='match_score', ascending=False)
        return matches.head(limit).to_dict(orient='records')
