"""
Notification utility functions for sending notifications to users.
Handles both database storage and real-time WebSocket delivery.
"""
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification


def send_notification(user, message):
    """
    Send a notification to a single user.
    
    Args:
        user: User instance to receive the notification
        message: String message content
        
    Returns:
        The created Notification instance
    """
    # Save to database
    notification = Notification.objects.create(
        user=user,
        message=message
    )
    
    # Send real-time via WebSocket
    channel_layer = get_channel_layer()
    if channel_layer:
        try:
            async_to_sync(channel_layer.group_send)(
                f"user_{user.id}",
                {
                    "type": "notify",
                    "data": {
                        "id": notification.id,
                        "message": notification.message,
                        "created_at": notification.created_at.isoformat(),
                        "read": False
                    }
                }
            )
        except Exception as e:
            # Log error but don't fail the request
            print(f"Error sending real-time notification: {e}")
    
    return notification


def send_bulk_notifications(users, message):
    """
    Send the same notification to multiple users.
    
    Args:
        users: QuerySet or list of User instances
        message: String message content
        
    Returns:
        List of created Notification instances
    """
    notifications = []
    channel_layer = get_channel_layer()
    
    for user in users:
        # Save to database
        notification = Notification.objects.create(
            user=user,
            message=message
        )
        notifications.append(notification)
        
        # Send real-time via WebSocket
        if channel_layer:
            try:
                async_to_sync(channel_layer.group_send)(
                    f"user_{user.id}",
                    {
                        "type": "notify",
                        "data": {
                            "id": notification.id,
                            "message": notification.message,
                            "created_at": notification.created_at.isoformat(),
                            "read": False
                        }
                    }
                )
            except Exception as e:
                print(f"Error sending real-time notification to user {user.id}: {e}")
    
    return notifications


def send_custom_notification(user, message, extra_data=None):
    """
    Send a notification with custom data fields.
    
    Args:
        user: User instance to receive the notification
        message: String message content
        extra_data: Optional dict of additional data to include in real-time notification
        
    Returns:
        The created Notification instance
    """
    # Save to database
    notification = Notification.objects.create(
        user=user,
        message=message
    )
    
    # Prepare notification data
    notification_data = {
        "id": notification.id,
        "message": notification.message,
        "created_at": notification.created_at.isoformat(),
        "read": False
    }
    
    # Merge extra data if provided
    if extra_data:
        notification_data.update(extra_data)
    
    # Send real-time via WebSocket
    channel_layer = get_channel_layer()
    if channel_layer:
        try:
            async_to_sync(channel_layer.group_send)(
                f"user_{user.id}",
                {
                    "type": "notify",
                    "data": notification_data
                }
            )
        except Exception as e:
            print(f"Error sending custom notification: {e}")
    
    return notification
