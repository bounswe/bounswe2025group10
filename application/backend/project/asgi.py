# zerowaste/asgi.py
import os




from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")






django_asgi_app = get_asgi_application()

import notifications.routing 

application = ProtocolTypeRouter({
    # HTTP requests are handled by Django as usual
    "http": django_asgi_app,

    # WebSocket connections are handled by Channels
    "websocket": AuthMiddlewareStack(
        URLRouter(
            notifications.routing.websocket_urlpatterns
        )
    ),
})