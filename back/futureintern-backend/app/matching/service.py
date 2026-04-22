"""
AI Internship Matching Service
================================
Hybrid TF-IDF + Sentence-BERT (SBERT) matching engine.
Replaces rule-based matching with semantic similarity scoring.

Architecture:
  Student Profile Text → TF-IDF (30%) + SBERT (70%) → Cosine Similarity → Match Score
  Falls back to 100% TF-IDF if sentence-transformers is not installed.
"""

import re
import logging
import numpy as np
from typing import List, Dict, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# TEXT PREPROCESSING
# ─────────────────────────────────────────────

STOPWORDS = {
    "a","an","the","and","or","but","in","on","at","to","for","of","with",
    "is","are","was","were","be","been","being","have","has","had","do","does",
    "did","will","would","could","should","may","might","i","we","you","he","she",
    "they","it","this","that","these","those","our","your","their","my","his","her"
}

def preprocess_text(text: str) -> str:
    """Clean and normalize text for NLP processing."""
    if not text or not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-z0-9\s\+\#]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    tokens = [w for w in text.split() if w not in STOPWORDS and len(w) > 1]
    return " ".join(tokens)


# ─────────────────────────────────────────────
# TF-IDF MODULE
# ─────────────────────────────────────────────

class TFIDFMatcher:
    """TF-IDF based lexical similarity engine."""

    def __init__(self, max_features: int = 10000, ngram_range: Tuple = (1, 2)):
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            ngram_range=ngram_range,
            sublinear_tf=True,
            strip_accents="unicode",
            analyzer="word",
        )
        self.corpus_matrix = None
        self.fitted = False

    def fit(self, corpus: List[str]) -> "TFIDFMatcher":
        processed = [preprocess_text(t) for t in corpus]
        self.corpus_matrix = self.vectorizer.fit_transform(processed)
        self.fitted = True
        logger.info(f"TF-IDF fitted on {len(corpus)} documents")
        return self

    def score(self, query: str, top_k: int = 10) -> List[Tuple[int, float]]:
        if not self.fitted:
            raise RuntimeError("Call fit() before score()")
        q_vec = self.vectorizer.transform([preprocess_text(query)])
        scores = cosine_similarity(q_vec, self.corpus_matrix).flatten()
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [(int(i), float(scores[i])) for i in top_indices]


# ─────────────────────────────────────────────
# TRANSFORMER (SBERT) MODULE
# ─────────────────────────────────────────────

class TransformerMatcher:
    """Sentence-BERT semantic similarity engine."""

    DEFAULT_MODEL = "all-MiniLM-L6-v2"

    def __init__(self, model_name: str = DEFAULT_MODEL):
        self.corpus_embeddings: Optional[np.ndarray] = None
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading SBERT model: {model_name}")
            self.model = SentenceTransformer(model_name)
            self.model_name = model_name
            self.available = True
        except ImportError:
            logger.warning("sentence-transformers not installed — SBERT disabled, TF-IDF only")
            self.model = None
            self.available = False

    def encode_corpus(self, corpus: List[str], batch_size: int = 32) -> "TransformerMatcher":
        if not self.available:
            return self
        logger.info(f"Encoding {len(corpus)} documents with SBERT...")
        self.corpus_embeddings = self.model.encode(
            corpus,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        return self

    def score(self, query: str, top_k: int = 10) -> List[Tuple[int, float]]:
        if not self.available or self.corpus_embeddings is None:
            return []
        q_emb = self.model.encode(
            [preprocess_text(query)],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        scores = (q_emb @ self.corpus_embeddings.T).flatten()
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [(int(i), float(scores[i])) for i in top_indices]


# ─────────────────────────────────────────────
# HYBRID MATCHER (TF-IDF + SBERT)
# ─────────────────────────────────────────────

class HybridMatcher:
    """
    Combines TF-IDF (lexical) and SBERT (semantic) scores via weighted fusion.
    Default: 30% TF-IDF + 70% SBERT.
    Falls back to 100% TF-IDF if sentence-transformers is unavailable.
    """

    def __init__(
        self,
        tfidf_weight: float = 0.3,
        transformer_weight: float = 0.7,
        transformer_model: str = TransformerMatcher.DEFAULT_MODEL,
    ):
        self.tfidf_weight = tfidf_weight
        self.transformer_weight = transformer_weight
        self.tfidf = TFIDFMatcher()
        self.transformer = TransformerMatcher(transformer_model)
        self.internships: List[Dict] = []
        self.fitted = False

        if not self.transformer.available:
            self.tfidf_weight = 1.0
            self.transformer_weight = 0.0

    def fit(self, internships: List[Dict]) -> "HybridMatcher":
        """Fit on internship corpus. Each dict needs: id, title, description, skills, requirements."""
        self.internships = internships
        corpus = [
            (i.get("description", "") + " " +
             i.get("title", "") + " " +
             i.get("skills", "") + " " +
             i.get("requirements", ""))
            for i in internships
        ]
        self.tfidf.fit(corpus)
        if self.transformer.available:
            self.transformer.encode_corpus(corpus)
        self.fitted = True
        logger.info(f"HybridMatcher fitted on {len(internships)} internships")
        return self

    def match(self, student_profile: Dict, top_k: int = 10) -> List[Dict]:
        """
        Match a student profile against all internships.
        Uses: skills, interests, bio, major, courses, projects from student_profile.
        Returns top_k internships ranked by match score (0-100).
        """
        if not self.fitted:
            raise RuntimeError("Call fit() before match()")

        query = self._build_student_query(student_profile)
        logger.info(f"Student query built: {query[:200]}...")

        tfidf_scores = dict(self.tfidf.score(query, top_k=len(self.internships)))
        sbert_scores = dict(self.transformer.score(query, top_k=len(self.internships))) if self.transformer.available else {}

        all_indices = set(tfidf_scores) | set(sbert_scores)
        fused = {
            idx: self.tfidf_weight * tfidf_scores.get(idx, 0.0) +
                 self.transformer_weight * sbert_scores.get(idx, 0.0)
            for idx in all_indices
        }

        ranked = sorted(fused.items(), key=lambda x: x[1], reverse=True)[:top_k]

        results = []
        for rank, (idx, score) in enumerate(ranked, 1):
            internship = self.internships[idx].copy()
            internship["match_score"] = round(score * 100, 2)
            internship["match_rank"] = rank
            internship["tfidf_score"] = round(tfidf_scores.get(idx, 0.0) * 100, 2)
            internship["sbert_score"] = round(sbert_scores.get(idx, 0.0) * 100, 2)
            results.append(internship)

        return results

    def _build_student_query(self, profile: Dict) -> str:
        """Build a rich query string from all student profile fields."""
        def to_str(val):
            if isinstance(val, list):
                return " ".join(str(v) for v in val if v)
            return str(val) if val else ""

        parts = [
            to_str(profile.get("skills", "")),
            to_str(profile.get("interests", "")),
            to_str(profile.get("bio", "")),
            to_str(profile.get("major", "")),
            to_str(profile.get("courses", "")),
            to_str(profile.get("projects", "")),
        ]
        return " ".join(p for p in parts if p)


# ─────────────────────────────────────────────
# SINGLETON — reuse fitted matcher across requests
# ─────────────────────────────────────────────

_matcher_instance: Optional[HybridMatcher] = None

def get_matcher() -> HybridMatcher:
    """Return global HybridMatcher (creates once, reuses)."""
    global _matcher_instance
    if _matcher_instance is None:
        _matcher_instance = HybridMatcher()
    return _matcher_instance

def reset_matcher():
    """Force re-fit on next request (call after internship data changes)."""
    global _matcher_instance
    _matcher_instance = None


# ─────────────────────────────────────────────
# LEGACY STUB — kept for api.py compatibility
# ─────────────────────────────────────────────

class MatchingService:
    """Deprecated stub — use HybridMatcher directly via get_matcher()."""
    pass
