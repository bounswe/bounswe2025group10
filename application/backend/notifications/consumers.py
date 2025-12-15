import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

from .models import Notification

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Accept all connections; authenticate later via message payload.
        self.user = None
        self.is_authenticated_user = False
        self.group_names = set()

        # Optional: join an anonymous group (not used for per-user notifications)
        anon_group = "user_anon"
        await self.channel_layer.group_add(anon_group, self.channel_name)
        self.group_names.add(anon_group)

        await self.accept()
        print(f"WebSocket connected (unauthenticated) channel={self.channel_name}")

    async def disconnect(self, close_code):
        for group_name in list(self.group_names):
            await self.channel_layer.group_discard(group_name, self.channel_name)
        self.group_names.clear()

    async def receive(self, text_data):
        """
        Handle messages from the client.
        Example payload:
        { "action": "fetch_notifications" }
        """
        try:
            data = json.loads(text_data)
        except Exception:
            await self.send(text_data=json.dumps({"type": "error", "detail": "Invalid JSON payload."}))
            return

        action = data.get("action")

        if action == "authenticate":
            token = data.get("token")
            if not token:
                await self.send(text_data=json.dumps({"type": "auth_error", "detail": "Missing token."}))
                await self.close()
                return

            try:
                access = AccessToken(token)
                user_id = access.get("user_id")
                if not user_id:
                    raise ValueError("Token missing user_id claim")
                user = await sync_to_async(User.objects.get)(id=user_id)
            except Exception as e:
                await self.send(text_data=json.dumps({"type": "auth_error", "detail": "Invalid token."}))
                await self.close()
                return

            self.user = user
            self.is_authenticated_user = True

            user_group = f"user_{user.id}"
            await self.channel_layer.group_add(user_group, self.channel_name)
            self.group_names.add(user_group)

            await self.send(text_data=json.dumps({"type": "auth_success"}))
            return

        if action == "fetch_notifications":
            if not self.is_authenticated_user:
                await self.send(text_data=json.dumps({"type": "auth_required"}))
                return
            notifications = await self.get_notifications()
            await self.send(text_data=json.dumps({"notifications": notifications}))

    @sync_to_async
    def get_notifications(self):
        if not self.is_authenticated_user or not self.user:
            return []  # no stored notifications for anonymous

        notifications = Notification.objects.filter(
            user=self.user
        ).order_by("-created_at")

        return [
            {
                "id": n.id,
                "message": n.message,
                "created_at": n.created_at.isoformat(),
                "read": n.read,
            }
            for n in notifications
        ]

    async def notify(self, event):
        """
        This is called when group_send() is used with type 'notify'.
        event looks like:
        {
            "type": "notify",
            "data": { ... }
        }
        """
        await self.send(text_data=json.dumps(event["data"]))
