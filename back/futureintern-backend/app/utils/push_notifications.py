"""
Expo Push Notification helper.
Uses the Expo Push API — no SDK required, plain HTTP POST.
Tokens are in the format: ExponentPushToken[xxxxxxxxxx]
"""
import requests
from flask import current_app

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push_notification(user_id: int, title: str, body: str, data: dict = None):
    """
    Send a push notification to all registered devices for a user.
    Silently ignores errors so it never breaks the calling request.
    """
    try:
        from app.models.push_token import UserPushToken

        tokens = UserPushToken.query.filter_by(user_id=user_id).all()
        if not tokens:
            return

        messages = [
            {
                "to": t.token,
                "title": title,
                "body": body,
                "data": data or {},
                "sound": "default",
                "priority": "high",
            }
            for t in tokens
        ]

        # Expo accepts up to 100 messages per request
        for i in range(0, len(messages), 100):
            chunk = messages[i:i + 100]
            resp = requests.post(
                EXPO_PUSH_URL,
                json=chunk,
                headers={
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                timeout=10,
            )
            if not resp.ok:
                current_app.logger.warning(
                    "Push notification failed for user %s: %s", user_id, resp.text
                )
    except Exception as e:
        current_app.logger.warning("Push notification error for user %s: %s", user_id, e)
