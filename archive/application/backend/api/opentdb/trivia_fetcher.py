import requests
import html


TRIVIA_API_URL = "https://opentdb.com/api.php?amount=1&type=multiple"


def get_random_trivia_question():
    try:
        response = requests.get(TRIVIA_API_URL, timeout=5)
        if response.status_code != 200:
            return None

        data = response.json()
        if data["response_code"] != 0 or not data["results"]:
            return None

        result = data["results"][0]

        return {
            "question": html.unescape(result["question"]),
            "correct_answer": html.unescape(result["correct_answer"]),
            "incorrect_answers": [html.unescape(ans) for ans in result["incorrect_answers"]],
            "category": result["category"],
            "difficulty": result["difficulty"],
        }

    except requests.RequestException:
        return None