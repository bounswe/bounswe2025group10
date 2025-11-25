from django.contrib import admin
from .models import Users, Follow

# Register your models here.

admin.site.register(Users)


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    """Admin configuration for Follow model"""
    list_display = ['follower', 'following', 'created_at']
    list_filter = ['created_at']
    search_fields = ['follower__username', 'following__username']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('follower', 'following')
