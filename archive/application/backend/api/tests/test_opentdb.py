from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch


class TriviaQuestionViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('get_trivia_question')

    @patch('api.opentdb.trivia_fetcher.requests.get')
    def test_successful_trivia_fetch(self, mock_get):
        mock_response = {
            "response_code": 0,
            "results": [
                {
                    "category": "Science: Computers",
                    "type": "multiple",
                    "difficulty": "easy",
                    "question": "What does CPU stand for?",
                    "correct_answer": "Central Processing Unit",
                    "incorrect_answers": [
                        "Central Process Unit",
                        "Computer Personal Unit",
                        "Central Processor Unit"
                    ]
                }
            ]
        }
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = mock_response

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("question", response.data)
        self.assertIn("correct_answer", response.data)

    @patch('api.opentdb.trivia_fetcher.requests.get')
    def test_failed_trivia_fetch(self, mock_get):
        mock_get.return_value.status_code = 500
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)