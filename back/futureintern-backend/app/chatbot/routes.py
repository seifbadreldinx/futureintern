from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from datetime import datetime
import requests as http_requests

chatbot_bp = Blueprint('chatbot', __name__)

SYSTEM_PROMPT = """You are FutureIntern AI, an intelligent career assistant built into the FutureIntern platform — a professional platform connecting students with internship opportunities in Egypt and the Middle East.

**Language Support:**
- You are fully bilingual: English and Arabic.
- Detect the language of the user's message and always respond in the same language.
- For Arabic responses, use clear Modern Standard Arabic (الفصحى).

**Your Role:**
- Guide students through finding, applying for, and succeeding in internships.
- Provide resume/CV tips, interview preparation advice, and career guidance.
- Help users navigate the FutureIntern platform.
- Be friendly, professional, empathetic, and encouraging.
- Remember previous messages in the conversation and maintain context.

**Platform Knowledge:**
- Browse internships at /browse
- Manage applications at /dashboard
- Upload your CV from the profile/dashboard section
- Contact support at /contact or /get-help
- The platform uses AI matching — a complete profile improves matches
- Points system: earn points by logging in daily, completing profile, applying for internships

**Response Style:**
- Be conversational and warm, like a career counselor
- Give actionable, specific advice
- Use bullet points or numbered steps for processes
- Keep responses concise but complete (under 300 words unless asked for more)
- If unsure about something, say so honestly and direct to /contact

You are NOT just a FAQ bot — you can discuss resumes, career paths, interview tips, salary expectations, industry trends, and anything career-related."""


# All possible HuggingFace endpoint URL patterns to try (in order)
HF_URL_PATTERNS = [
    "https://router.huggingface.co/v1/chat/completions",
    "https://router.huggingface.co/hf-inference/v1/chat/completions",
    "https://router.huggingface.co/hf-inference/models/{model}/v1/chat/completions",
    "https://api-inference.huggingface.co/v1/chat/completions",
    "https://api-inference.huggingface.co/models/{model}/v1/chat/completions",
    "https://api-inference.huggingface.co/models/{model}",
]

# Will be set after /status discovers the working URL
_working_url_pattern = None


def call_huggingface(messages: list, api_key: str, model: str, url_pattern: str = None) -> str:
    """
    Call Hugging Face Inference API.
    If url_pattern is provided, use it directly.
    Otherwise, try all known URL patterns.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    # OpenAI-compatible payload (for chat/completions endpoints)
    chat_payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 512,
        "temperature": 0.7,
        "top_p": 0.9,
        "stream": False,
    }

    # Legacy text-generation payload
    def build_prompt(msgs):
        prompt = ""
        for m in msgs:
            if m["role"] == "system":
                prompt += f"System: {m['content']}\n\n"
            elif m["role"] == "user":
                prompt += f"User: {m['content']}\n"
            elif m["role"] == "assistant":
                prompt += f"Assistant: {m['content']}\n"
        prompt += "Assistant:"
        return prompt

    patterns = [url_pattern] if url_pattern else HF_URL_PATTERNS
    last_error = None

    for pattern in patterns:
        url = pattern.format(model=model) if "{model}" in pattern else pattern

        # For legacy text-gen endpoint (no /chat/completions)
        if url.endswith(f"/models/{model}") and "/v1/" not in url:
            payload = {
                "inputs": build_prompt(messages),
                "parameters": {
                    "max_new_tokens": 512,
                    "temperature": 0.7,
                    "return_full_text": False,
                },
            }
        else:
            payload = chat_payload

        try:
            resp = http_requests.post(url, headers=headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            # Parse response based on format
            if isinstance(data, list) and data:
                # Legacy text-generation format
                text = data[0].get("generated_text", "").strip()
            elif isinstance(data, dict) and "choices" in data:
                # OpenAI-compatible format
                text = data["choices"][0]["message"]["content"].strip()
            else:
                continue

            if text:
                # Remember the working pattern for future calls
                global _working_url_pattern
                _working_url_pattern = pattern
                return text

        except Exception as e:
            last_error = f"{url}: {str(e)}"
            continue

    raise RuntimeError(f"All HF URL patterns failed. Last error: {last_error}")


@chatbot_bp.route("/")
def index():
    return jsonify({"message": "FutureIntern AI Chatbot — powered by Hugging Face"})


@chatbot_bp.route("/status")
def status():
    """Diagnostic endpoint — tries ALL URL patterns and reports which works."""
    hf_key = current_app.config.get("HUGGINGFACE_API_KEY")
    openai_key = current_app.config.get("OPENAI_API_KEY")
    hf_model = current_app.config.get("HUGGINGFACE_MODEL", "microsoft/Phi-3-mini-4k-instruct")

    result = {
        "huggingface_key_set": bool(hf_key),
        "huggingface_key_prefix": hf_key[:8] + "..." if hf_key else None,
        "huggingface_model": hf_model,
        "openai_key_set": bool(openai_key),
        "url_tests": {},
    }

    if not hf_key:
        return jsonify(result), 200

    test_msgs = [{"role": "user", "content": "Say hello in 5 words."}]
    chat_payload = {
        "model": hf_model,
        "messages": test_msgs,
        "max_tokens": 50,
        "temperature": 0.7,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {hf_key}",
        "Content-Type": "application/json",
    }

    for pattern in HF_URL_PATTERNS:
        url = pattern.format(model=hf_model) if "{model}" in pattern else pattern
        try:
            resp = http_requests.post(url, headers=headers, json=chat_payload, timeout=15)
            if resp.ok:
                data = resp.json()
                if isinstance(data, dict) and "choices" in data:
                    text = data["choices"][0]["message"]["content"].strip()
                    result["url_tests"][pattern] = f"✅ OK: {text[:60]}"
                elif isinstance(data, list):
                    result["url_tests"][pattern] = f"✅ OK (legacy): {str(data)[:60]}"
                else:
                    result["url_tests"][pattern] = f"⚠️ {resp.status_code}: {str(data)[:80]}"
            else:
                result["url_tests"][pattern] = f"❌ {resp.status_code}: {resp.text[:80]}"
        except Exception as e:
            result["url_tests"][pattern] = f"❌ Error: {str(e)[:80]}"

    return jsonify(result), 200


@chatbot_bp.route("/chat", methods=["POST"])
def chat():
    """Main AI chat endpoint."""
    try:
        data = request.get_json() or {}
        user_message = (data.get("message") or "").strip()
        conversation_history = data.get("history", [])

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # ── Points check for authenticated students ──
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                from app.models.user import User
                from app.models import db
                from app.utils.points import check_and_charge
                user = db.session.get(User, int(user_id))
                if user and user.role == "student":
                    success, msg, _ = check_and_charge(user, "chatbot")
                    if not success:
                        return jsonify({
                            "response": msg,
                            "provider": "system",
                            "timestamp": datetime.utcnow().isoformat(),
                        }), 402
                    db.session.commit()
        except Exception:
            pass

        # ── Build message list ──
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for entry in conversation_history[-10:]:
            role = "user" if entry.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": entry.get("text", "")})
        messages.append({"role": "user", "content": user_message})

        # ── Try OpenAI first (if configured) ──
        openai_key = current_app.config.get("OPENAI_API_KEY")
        if openai_key:
            try:
                r = http_requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": current_app.config.get("OPENAI_MODEL", "gpt-4o-mini"),
                        "messages": messages,
                        "max_tokens": 512,
                        "temperature": 0.7,
                    },
                    timeout=20,
                )
                r.raise_for_status()
                answer = r.json()["choices"][0]["message"]["content"].strip()
                return jsonify({
                    "response": answer,
                    "provider": "openai",
                    "timestamp": datetime.utcnow().isoformat(),
                }), 200
            except Exception as e:
                current_app.logger.warning("OpenAI fallback: %s", e)

        # ── Try Hugging Face (auto-discovers working URL) ──
        hf_key = current_app.config.get("HUGGINGFACE_API_KEY")
        hf_model = current_app.config.get(
            "HUGGINGFACE_MODEL", "microsoft/Phi-3-mini-4k-instruct"
        )
        if hf_key:
            try:
                answer = call_huggingface(
                    messages, hf_key, hf_model,
                    url_pattern=_working_url_pattern  # use cached URL if found
                )
                if answer:
                    return jsonify({
                        "response": answer,
                        "provider": "huggingface",
                        "timestamp": datetime.utcnow().isoformat(),
                    }), 200
            except Exception as e:
                current_app.logger.warning("HuggingFace error: %s", e)

        # ── Final fallback ──
        return jsonify({
            "response": (
                "I'm sorry, the AI service is temporarily unavailable. "
                "Please try again in a moment, or visit /get-help for assistance."
            ),
            "provider": "fallback",
            "timestamp": datetime.utcnow().isoformat(),
        }), 200

    except Exception as e:
        current_app.logger.error("Chatbot error: %s", e)
        return jsonify({"error": str(e)}), 500
