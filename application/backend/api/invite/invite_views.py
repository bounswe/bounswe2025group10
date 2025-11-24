from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


@swagger_auto_schema(
    method='post',
    operation_summary="Send invitation email",
    operation_description=(
        "Sends an invitation email containing the ZeroWaste website link to the "
        "specified recipient email address. Requires authentication.\n\n"
        "Expected JSON body:\n"
        "{\n"
        '  "email": "friend@example.com"\n'
        "}"
    ),
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["email"],
        properties={
            "email": openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_EMAIL,
                description="Recipient email address"
            ),
        },
    ),
    responses={
        200: openapi.Response(
            description="Invitation email sent successfully",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "message": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="Success message"
                    )
                }
            ),
        ),
        400: openapi.Response(
            description="Bad request (email missing or invalid)",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "error": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="Error message"
                    )
                }
            ),
        ),
        401: "Authentication credentials were not provided or are invalid.",
        500: openapi.Response(
            description="Internal server error while sending email",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "error": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="Error message"
                    )
                }
            ),
        ),
    },
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_invitation_email(request):
    """
    Send an invitation email containing the ZeroWaste website link.
    Email is sent from a no-reply address.
    Expected JSON:
    {
        "email": "friend@example.com"
    }
    """
    recipient = request.data.get("email")

    if not recipient:
        return Response(
            {"error": "Recipient email is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Construct email content
    website_link = "https://zerowaste.ink"

    subject = "Join Zero Waste Today!"
    message = (
        "Hello!\n\n"
        "You've been invited to join Zero Waste.\n"
        f"Click the link below to get started:\n{website_link}\n\n"
        "This is an automated message. Please do not reply."
    )
    print(f"EMAIL_BACKEND={settings.EMAIL_BACKEND}, HOST={settings.EMAIL_HOST}")
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        return Response(
            {"message": f"Invitation email sent to {recipient}"},
            status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
