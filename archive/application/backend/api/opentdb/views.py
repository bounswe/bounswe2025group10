from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .trivia_fetcher import get_random_trivia_question


@permission_classes([AllowAny])
class TriviaQuestionView(APIView):
    """
    API endpoint to fetch a random trivia question from Open Trivia DB.
    """


    def get(self, request):
        question_data = get_random_trivia_question()
        if question_data is None:
            return Response(
                {"error": "Failed to fetch trivia question."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(question_data, status=status.HTTP_200_OK)