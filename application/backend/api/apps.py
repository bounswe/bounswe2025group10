from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    print("✅ ApiConfig instantiated")
    def ready(self):
        print("✅ ApiConfig.ready() called") 
        from .activities.signals import activity_signals  # noqa: F401
        from .utils import badge_signals  # noqa: F401