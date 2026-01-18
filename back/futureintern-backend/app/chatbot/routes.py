"""
Chatbot API - Task 5.3
Simple FAQ chatbot for answering common questions
"""
from flask import Blueprint, jsonify, request
from datetime import datetime

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

def find_best_match(message):
    """Find the best matching FAQ based on keywords"""
    message_lower = message.lower()
    
    # Check each FAQ category
    for category, faq in FAQ_DATABASE.items():
        for keyword in faq['keywords']:
            if keyword in message_lower:
                return faq['answer'], category
    
    return None, None

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
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Find best matching answer
        answer, category = find_best_match(user_message)
        
        if answer:
            return jsonify({
                'response': answer,
                'category': category,
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
