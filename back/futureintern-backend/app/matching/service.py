# Enhanced Matching Service with NLP and Fuzzy Matching
# خدمة المطابقة المحسّنة باستخدام معالجة اللغات الطبيعية والمطابقة الذكية

from typing import List, Dict
import re
import logging
from fuzzywuzzy import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Setup logging
logger = logging.getLogger(__name__)

class MatchingService:
    
    # أوزان محسّنة لكل معيار
    WEIGHTS = {
        'skills': 0.35,           # 35% - مطابقة المهارات
        'text_similarity': 0.25,  # 25% - تشابه النصوص (الوصف والمتطلبات)
        'major': 0.20,            # 20% - التخصص
        'location': 0.10,         # 10% - الموقع
        'availability': 0.10      # 10% - التوفر
    }
    
    # عتبة المطابقة الضبابية (Fuzzy Threshold)
    FUZZY_THRESHOLD = 75  # 75% similarity minimum
    
    def __init__(self):
        """Initialize the matching service"""
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words='english',
            ngram_range=(1, 2),  # unigrams and bigrams
            max_features=100
        )
    
    def normalize_text(self, text: str) -> str:
        """
        تنظيف وتوحيد النص
        Normalize and clean text for better matching
        """
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-z0-9\s+#]', ' ', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def fuzzy_match_skills(self, student_skills: List[str], required_skills: List[str]) -> float:
        """
        مطابقة المهارات باستخدام Fuzzy Matching
        Match skills using fuzzy string matching for similar keywords
        
        Returns: score between 0 and 1
        """
        if not required_skills or not student_skills:
            return 0.0
        
        # Normalize skills
        student_skills_norm = [self.normalize_text(s) for s in student_skills]
        required_skills_norm = [self.normalize_text(s) for s in required_skills]
        
        matched_count = 0
        partial_matches = 0
        
        for req_skill in required_skills_norm:
            if not req_skill:
                continue
                
            best_match_score = 0
            
            for student_skill in student_skills_norm:
                if not student_skill:
                    continue
                
                # Exact match
                if req_skill == student_skill:
                    matched_count += 1
                    best_match_score = 100
                    break
                
                # Partial match (one contains the other)
                if req_skill in student_skill or student_skill in req_skill:
                    score = 90
                    best_match_score = max(best_match_score, score)
                    continue
                
                # Fuzzy match
                fuzzy_score = fuzz.token_sort_ratio(req_skill, student_skill)
                best_match_score = max(best_match_score, fuzzy_score)
            
            # Count as match if above threshold
            if best_match_score >= 100:
                continue  # Already counted
            elif best_match_score >= self.FUZZY_THRESHOLD:
                partial_matches += 1
        
        # Calculate final score
        # Full matches count as 1.0, partial matches as 0.7
        total_score = (matched_count * 1.0) + (partial_matches * 0.7)
        max_possible = len(required_skills_norm)
        
        return min(total_score / max_possible, 1.0) if max_possible > 0 else 0.0
    
    def calculate_text_similarity(self, student_text: str, internship_text: str) -> float:
        """
        حساب التشابه بين النصوص باستخدام TF-IDF و Cosine Similarity
        Calculate text similarity using TF-IDF and cosine similarity
        
        Returns: score between 0 and 1
        """
        if not student_text or not internship_text:
            return 0.0
        
        # Normalize texts
        student_text = self.normalize_text(student_text)
        internship_text = self.normalize_text(internship_text)
        
        if not student_text or not internship_text:
            return 0.0
        
        try:
            # Create TF-IDF vectors
            tfidf_matrix = self.vectorizer.fit_transform([student_text, internship_text])
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
        except:
            # Fallback to simple word overlap if TF-IDF fails
            student_words = set(student_text.split())
            internship_words = set(internship_text.split())
            
            if not student_words or not internship_words:
                return 0.0
            
            overlap = len(student_words & internship_words)
            total = len(student_words | internship_words)
            
            return overlap / total if total > 0 else 0.0
    
    def fuzzy_match_major(self, student_major: str, internship_major: str) -> float:
        """
        مطابقة التخصص باستخدام Fuzzy Matching
        Match major/field of study with fuzzy matching
        
        Returns: score between 0 and 1
        """
        if not student_major or not internship_major:
            return 0.0
        
        student_major = self.normalize_text(student_major)
        internship_major = self.normalize_text(internship_major)
        
        # Exact match
        if student_major == internship_major:
            return 1.0
        
        # Partial match
        if student_major in internship_major or internship_major in student_major:
            return 0.9
        
        # Fuzzy match
        fuzzy_score = fuzz.token_sort_ratio(student_major, internship_major)
        
        if fuzzy_score >= 90:
            return 0.9
        elif fuzzy_score >= 75:
            return 0.7
        elif fuzzy_score >= 60:
            return 0.5
        else:
            return 0.0
    
    def calculate_score(self, student: Dict, internship: Dict) -> Dict:
        """
        حساب نقاط المطابقة الكلية
        Calculate comprehensive matching score for an internship
        
        Returns: Dictionary with detailed scores
        """
        details = {}
        
        logger.info(f"\n{'='*60}")
        logger.info(f"MATCHING DEBUG: Student vs Internship '{internship.get('title', 'Unknown')}'")
        logger.info(f"{'='*60}")
        
        # ==========================================
        # 1️⃣ Skills Matching (35%)
        # ==========================================
        student_skills = student.get('skills', [])
        logger.info(f"Student Skills: {student_skills}")
        
        # Parse internship required skills
        intern_skills_raw = internship.get('required_skills', '[]')
        if isinstance(intern_skills_raw, str):
            try:
                import json
                intern_req_skills = json.loads(intern_skills_raw)
            except:
                intern_req_skills = [s.strip() for s in intern_skills_raw.split(',') if s.strip()]
        else:
            intern_req_skills = intern_skills_raw if isinstance(intern_skills_raw, list) else []
        
        # Calculate fuzzy skills match
        skills_score = self.fuzzy_match_skills(student_skills, intern_req_skills)
        details['skills'] = round(skills_score * self.WEIGHTS['skills'] * 100, 1)
        logger.info(f"✓ Skills Score: {skills_score:.2f} x {self.WEIGHTS['skills']} = {details['skills']}%")
        
        # ==========================================
        # 2️⃣ Text Similarity (25%)
        # ==========================================
        # Combine student profile text
        student_text_parts = []
        student_text_parts.extend(student.get('skills', []))
        if student.get('major'):
            student_text_parts.append(student['major'])
        student_profile_text = ' '.join(str(p) for p in student_text_parts)
        
        # Combine internship text (description + requirements + title)
        internship_text_parts = []
        if internship.get('title'):
            internship_text_parts.append(internship['title'])
        if internship.get('description'):
            internship_text_parts.append(internship['description'])
        if internship.get('requirements'):
            internship_text_parts.append(internship['requirements'])
        logger.info(f"✓ Text Similarity: {text_sim_score:.2f} x {self.WEIGHTS['text_similarity']} = {details['text_similarity']}%")
        internship_text_parts.extend(intern_req_skills)
        internship_full_text = ' '.join(str(p) for p in internship_text_parts)
        
        # Calculate text similarity
        text_sim_score = self.calculate_text_similarity(student_profile_text, internship_full_text)
        details['text_similarity'] = round(text_sim_score * self.WEIGHTS['text_similarity'] * 100, 1)
        
        # ==========================================
        # 3️⃣ Major Matching (20%)
        # ==========================================
        major_score = self.fuzzy_match_major(
            student.get('major', ''),
            internship.get('major', '')
        )
        details['major'] = round(major_score * self.WEIGHTS['major'] * 100, 1)
        logger.info(f"✓ Major: '{student.get('major', 'N/A')}' vs '{internship.get('major', 'N/A')}' = {major_score:.2f} x {self.WEIGHTS['major']} = {details['major']}%")
        
        # ==========================================
        # 4️⃣ Location Matching (10%)
        # ==========================================
        student_location = self.normalize_text(student.get('location', ''))
        intern_location = self.normalize_text(internship.get('location', ''))
        
        if not student_location or not intern_location:
            location_score = 0.5  # Neutral if location not specified
        elif student_location == intern_location:
            location_score = 1.0
        elif 'remote' in intern_location or 'remotely' in intern_location:
            location_score = 0.9  # Remote is good for everyone
        elif student_location in intern_location or intern_location in student_location:
            location_score = 0.8
        else:
            # Fuzzy match for location
            fuzzy_loc_score = fuzz.ratio(student_location, intern_location)
            location_score = fuzzy_loc_score / 100.0 if fuzzy_loc_score >= 60 else 0.3
        
        details['location'] = round(location_score * self.WEIGHTS['location'] * 100, 1)
        logger.info(f"✓ Location: '{student.get('location', 'N/A')}' vs '{internship.get('location', 'N/A')}' = {location_score:.2f} x {self.WEIGHTS['location']} = {details['location']}%")
        
        # ==========================================
        # 5️⃣ Availability Matching (10%)
        # ==========================================
        # Simplified for now - can be enhanced based on actual availability data
        student_availability = student.get('availability', 40)
        intern_availability = internship.get('required_availability', 30)
        
        if student_availability >= intern_availability:
            availability_score = 1.0
        else:
            availability_score = student_availability / intern_availability if intern_availability > 0 else 0.5
        
        details['availability'] = round(availability_score * self.WEIGHTS['availability'] * 100, 1)
        logger.info(f"✓ Availability: {student_availability}hrs vs {intern_availability}hrs = {availability_score:.2f} x {self.WEIGHTS['availability']} = {details['availability']}%")
        
        # ==========================================
        # 6️⃣ Total Score
        # ==========================================
        total_score = sum(details.values())
        details['total_score'] = round(total_score, 1)
        
        logger.info(f"\n{'='*60}")
        logger.info(f"TOTAL SCORE: {details['total_score']}%")
        logger.info(f"Breakdown: Skills={details['skills']}% + Text={details['text_similarity']}% + Major={details['major']}% + Location={details['location']}% + Availability={details['availability']}%")
        logger.info(f"{'='*60}\n")
        
        return details
    
    def match_student(self, student: Dict, internships: List[Dict]) -> List[Dict]:
        """
        مطابقة الطالب مع جميع التدريبات المتاحة
        Match student with all available internships and rank them
        
        Returns: List of internships with scores, sorted by best match
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
        # Sort by score (highest first)
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results
