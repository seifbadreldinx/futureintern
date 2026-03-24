from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from datetime import datetime
import requests as http_requests

chatbot_bp = Blueprint('chatbot', __name__)

SYSTEM_PROMPT = """You are FutureIntern AI, a career assistant on the FutureIntern platform which connects students with internships.

CRITICAL LANGUAGE RULE: Always reply in the SAME language the user writes in. If the user writes in English, you MUST reply in English only. If the user writes in Arabic, reply in Arabic.

You help with: finding internships, CV/resume tips, interview prep, career guidance, and platform navigation.

Platform info:
- Browse internships: /browse
- Dashboard: /dashboard
- Upload CV: profile section
- Support: /contact or /get-help
- AI matching improves with a complete profile
- Points: earn by daily login, profile completion, applying

Be concise, friendly, and actionable. Use bullet points for steps. Keep answers under 200 words."""


# Confirmed working HuggingFace endpoint (as of March 2026)
HF_URL = "https://router.huggingface.co/v1/chat/completions"

def call_huggingface(messages: list, api_key: str, model: str) -> str:
    """Call Hugging Face via the router endpoint (OpenAI-compatible)."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 300,
        "temperature": 0.7,
        "stream": False,
    }
    resp = http_requests.post(HF_URL, headers=headers, json=payload, timeout=25)
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


@chatbot_bp.route("/")
def index():
    return jsonify({"message": "FutureIntern AI Chatbot — powered by Hugging Face"})


@chatbot_bp.route("/status")
def status():
    """Quick health check for the AI chatbot."""
    hf_key = current_app.config.get("HUGGINGFACE_API_KEY")
    hf_model = current_app.config.get("HUGGINGFACE_MODEL", "Qwen/Qwen2.5-72B-Instruct")

    result = {
        "huggingface_key_set": bool(hf_key),
        "huggingface_model": hf_model,
        "url": HF_URL,
    }

    if hf_key:
        try:
            answer = call_huggingface(
                [{"role": "user", "content": "Say hello in 5 words."}],
                hf_key, hf_model,
            )
            result["status"] = "✅ OK"
            result["test_response"] = answer
        except Exception as e:
            result["status"] = f"❌ {str(e)}"

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

        # ── Try Hugging Face ──
        hf_key = current_app.config.get("HUGGINGFACE_API_KEY")
        hf_model = current_app.config.get(
            "HUGGINGFACE_MODEL", "Qwen/Qwen2.5-72B-Instruct"
        )
        if hf_key:
            try:
                answer = call_huggingface(messages, hf_key, hf_model)
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
