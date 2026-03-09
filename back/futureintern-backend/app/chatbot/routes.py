from flask import Blueprint, jsonify, request
from datetime import datetime
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import re

# Download required NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

# Initialize NLTK components
stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

chatbot_bp = Blueprint('chatbot', __name__)

# FAQ Database
FAQ_DATABASE = {
    'registration': {
        'keywords': ['register', 'sign up', 'create account', 'join'],
        'answer': 'To register, go to /api/auth/register/student for students or /api/auth/register/company for companies. You need to provide your name, email, and password.'
    },
    'login': {
        'keywords': ['login', 'sign in', 'access'],
        'answer': 'To login, send a POST request to /api/auth/login with your email and password. You will receive a JWT token for authentication.'
    },
    'apply': {
        'keywords': ['apply', 'application', 'submit'],
        'answer': 'Students can apply for internships by sending a POST request to /api/applications/apply with the internship_id, cover_letter, and resume_url.'
    },
    'internship': {
        'keywords': ['internship', 'post', 'create opportunity'],
        'answer': 'Companies can post internships by sending a POST request to /api/internships/ with details like title, description, requirements, location, and duration.'
    },
    'recommendations': {
        'keywords': ['recommendation', 'match', 'suggest', 'suitable'],
        'answer': 'Students can get personalized internship recommendations by accessing /api/recommendations. Our smart matching system considers your skills, major, location, and availability.'
    },
    'cv': {
        'keywords': ['cv', 'resume', 'upload'],
        'answer': 'Students can upload their CV by sending a POST request to /api/users/upload-cv with the CV file. Supported formats: PDF, DOC, DOCX. Maximum size: 5MB.'
    },
    'status': {
        'keywords': ['status', 'check application', 'application status'],
        'answer': 'Students can check their application status by accessing /api/applications/my. Companies can update application status via /api/applications/:id/status.'
    },
    'verify': {
        'keywords': ['verify', 'verification', 'approve company'],
        'answer': 'Company verification is done by administrators. Admins can approve companies via /api/admin/companies/:id/approve.'
    },
    'help': {
        'keywords': ['help', 'support', 'how to'],
        'answer': 'I can help you with: registration, login, applying for internships, posting internships, getting recommendations, uploading CV, checking application status, and company verification. Just ask!'
    }
}

def preprocess_text_with_nltk(text):
    """
    Enhanced NLP text preprocessing using NLTK
    
    Steps:
    1. Tokenization - Split text into words
    2. Lowercasing - Convert to lowercase
    3. Remove stopwords - Remove common words (the, is, at, etc.)
    4. Stemming - Reduce words to root form (running -> run)
    
    Returns: List of processed tokens
    """
    
    text = text.lower()
    
    
    text = re.sub(r'[^a-z0-9\s]', '', text)
    
    
    tokens = word_tokenize(text)
    
    
    processed_tokens = [
        stemmer.stem(token) 
        for token in tokens 
        if token not in stop_words and len(token) > 2
    ]
    
    return processed_tokens

def calculate_keyword_similarity(user_tokens, keyword_tokens):
    """
    Calculate similarity score between user message and FAQ keywords
    Uses token overlap and stemming for fuzzy matching
    """
    if not user_tokens or not keyword_tokens:
        return 0.0
    
    # Count matching tokens
    matches = sum(1 for token in user_tokens if token in keyword_tokens)
    
    # Calculate similarity score (Jaccard similarity)
    total_unique = len(set(user_tokens) | set(keyword_tokens))
    similarity = matches / total_unique if total_unique > 0 else 0.0
    
    return similarity

def find_best_match(message):
    """
    Find the best matching FAQ using NLTK-enhanced text processing
    
    Uses:
    - NLTK tokenization
    - Stopword removal
    - Porter Stemmer for word normalization
    - Similarity scoring for fuzzy matching
    """
    # Preprocess user message with NLTK
    user_tokens = preprocess_text_with_nltk(message)
    
    best_match = None
    best_category = None
    best_score = 0.0
    
    # Check each FAQ category
    for category, faq in FAQ_DATABASE.items():
        # Preprocess all keywords for this category
        category_tokens = []
        for keyword in faq['keywords']:
            keyword_tokens = preprocess_text_with_nltk(keyword)
            category_tokens.extend(keyword_tokens)
        
        # Remove duplicates
        category_tokens = list(set(category_tokens))
        
        # Calculate similarity score
        similarity = calculate_keyword_similarity(user_tokens, category_tokens)
        
        # Update best match if this score is higher
        if similarity > best_score:
            best_score = similarity
            best_match = faq['answer']
            best_category = category
    
    # Return match only if similarity is above threshold (20%)
    if best_score >= 0.2:
        return best_match, best_category, best_score
    
    return None, None, 0.0

@chatbot_bp.route("/")
def index():
    return jsonify({"message": "Chatbot API - Ask me anything!"})

@chatbot_bp.route("/chat", methods=["POST"])
def chat():
    """
    Chat with FAQ Bot
    ---
    tags:
      - Chatbot
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - message
          properties:
            message:
              type: string
              example: How do I register?
    responses:
      200:
        description: Bot response
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        user_message = data['message'].strip()
        conversation_history = data.get('history', [])
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
            
        from app.models.user import User
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
        from app.models import db
        import requests
        from flask import current_app
        import os

        # Check points logic if user is authenticated
        user = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                user = db.session.get(User, user_id)
        except Exception:
            pass
            
        if user and user.role == 'student':
            if user.points < 1:
                return jsonify({
                    'response': 'You do not have enough points. Please interact more with the platform or complete your profile to earn points! (Cost: 1 Point)',
                    'category': 'error',
                    'timestamp': datetime.utcnow().isoformat()
                }), 402  # Payment Required
            
            # Deduct point
            user.points -= 1
            db.session.commit()
            
        # 1. Try OpenAI if API Key is configured
        openai_key = current_app.config.get('OPENAI_API_KEY')
        if openai_key:
            try:
                system_prompt = """You are an intelligent and thoughtful assistant for FutureIntern, a professional platform connecting students with internship opportunities.

**Language Support:**
- You are fully bilingual and can communicate fluently in both English and Arabic
- Detect the language of the user's message and respond in the same language
- If the user writes in Arabic, respond in Arabic. If they write in English, respond in English
- You can seamlessly switch between languages if the user switches languages
- For Arabic responses, use proper Arabic grammar and formal language (الفصحى) when appropriate

**Your Role:**
- Think deeply about each question before responding
- Consider the context and intent behind user questions
- Provide comprehensive, well-structured answers
- Be friendly, professional, and empathetic
- Anticipate follow-up questions and address them proactively
- Remember previous messages in the conversation and maintain context

**Your Knowledge Base:**
You have extensive knowledge about:
- Internship application processes and best practices
- CV/resume upload and optimization
- AI-powered matching algorithms and how they work
- Account setup, profile management, and optimization
- Platform navigation and features
- Career guidance and internship search strategies
- Common student concerns and questions

**Response Guidelines:**
1. **Think First**: Analyze what the user is really asking - are they confused about a process? Do they need step-by-step guidance? Are they looking for tips?
2. **Be Comprehensive**: Provide detailed, actionable answers. Break down complex processes into clear steps.
3. **Be Proactive**: Anticipate related questions and address them. For example, if someone asks about applying, also mention CV requirements and what to expect.
4. **Use Examples**: When helpful, provide concrete examples or scenarios.
5. **Be Encouraging**: Support students in their internship search journey with positive, motivating language.
6. **Stay Focused**: Keep responses relevant to FutureIntern and internships, but be helpful and conversational.
7. **Maintain Context**: Remember what was discussed earlier in the conversation and reference it when relevant.

**Platform-Specific Information:**
- Students can browse internships at /browse
- Dashboard is available at /dashboard for managing applications
- Contact support at /contact or visit /get-help for detailed guides
- The platform uses AI matching to connect students with relevant opportunities
- Profile completion improves matching accuracy

**Tone:** Professional yet warm, encouraging, and supportive. Think like a career counselor who genuinely wants to help students succeed.

If asked about something outside your knowledge, politely acknowledge it and direct users to contact support at /contact or visit /get-help for specialized assistance."""
                
                messages = [{"role": "system", "content": system_prompt}]
                for msg in conversation_history:
                    role = "user" if msg.get("sender") == "user" else "assistant"
                    messages.append({"role": role, "content": msg.get("text", "")})
                messages.append({"role": "user", "content": user_message})

                openai_url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_key}"
                }
                payload = {
                    "model": current_app.config.get('OPENAI_MODEL', 'gpt-4o-mini'),
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.8
                }
                response = requests.post(openai_url, headers=headers, json=payload, timeout=15)
                response.raise_for_status()
                response_data = response.json()
                bot_answer = response_data.get('choices', [{}])[0].get('message', {}).get('content')
                
                if bot_answer:
                    return jsonify({
                        'response': bot_answer,
                        'category': 'ai',
                        'confidence': 100.0,
                        'nlp_used': True,
                        'timestamp': datetime.utcnow().isoformat()
                    }), 200
            except Exception as e:
                print(f"OpenAI fallback error: {str(e)}")
                # Continue below to fallback mechanism
        
        # 2. Fallback to NLTK-enhanced matching
        answer, category, confidence = find_best_match(user_message)
        
        if answer:
            return jsonify({
                'response': answer,
                'category': category,
                'confidence': round(confidence * 100, 1) if confidence else 0.0,  # Convert to percentage
                'nlp_used': True,
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        else:
            # Default response when no match found
            return jsonify({
                'response': "I'm sorry, I didn't understand that. I can help you with: registration, login, applications, internships, recommendations, CV upload, and verification. Try asking about one of these topics!",
                'category': 'unknown',
                'timestamp': datetime.utcnow().isoformat(),
                'suggestions': [
                    'How do I register?',
                    'How can I apply for an internship?',
                    'How do I get recommendations?',
                    'How do I upload my CV?'
                ]
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route("/faq", methods=["GET"])
def get_faq():
    """
    Get All FAQs
    ---
    tags:
      - Chatbot
    responses:
      200:
        description: List of all FAQ categories
    """
    try:
        faq_list = []
        for category, faq in FAQ_DATABASE.items():
            faq_list.append({
                'category': category,
                'keywords': faq['keywords'],
                'answer': faq['answer']
            })
        
        return jsonify({
            'total': len(faq_list),
            'faqs': faq_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route("/faq/<category>", methods=["GET"])
def get_faq_by_category(category):
    """Get FAQ answer for a specific category"""
    try:
        if category not in FAQ_DATABASE:
            return jsonify({'error': 'FAQ category not found'}), 404
        
        faq = FAQ_DATABASE[category]
        return jsonify({
            'category': category,
            'keywords': faq['keywords'],
            'answer': faq['answer']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
