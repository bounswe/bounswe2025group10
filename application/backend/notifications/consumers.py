import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer

from .models import Notification


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        # Decide group name
        if self.user.is_authenticated:
            self.group_name = f"user_{self.user.id}"
        else:
            self.group_name = "user_anon"

        # Join group so we can receive group_send() messages
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        print(f"WebSocket connected for user: {self.user} in group: {self.group_name}")

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """
        Handle messages from the client.
        Example payload:
        { "action": "fetch_notifications" }
        """
        data = json.loads(text_data)
        action = data.get("action")

        if action == "fetch_notifications":
            notifications = await self.get_notifications()
            await self.send(text_data=json.dumps({"notifications": notifications}))

    @sync_to_async
    def get_notifications(self):
        if not self.user.is_authenticated:
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
