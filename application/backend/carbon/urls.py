# urls.py
from django.urls import path
from .views import LocalCarbonFromJsonView

urlpatterns = [
    path("estimate/", LocalCarbonFromJsonView.as_view(), name="local-emissions"),
]
