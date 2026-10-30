
import re


def validate_tutor_response(response: str) -> tuple[bool, str]:
    """Return whether a tutor response passes basic heuristic checks."""

    text = response.strip()

    if not text:
        return False, "empty_response"

    # A hint should generally be short.
    if len(text.split()) > 100:
        return False, "response_too_long"

    # Flag explicit answer declarations.
    answer_patterns = [
        r"\bthe answer is\b",
        r"\bthe final answer is\b",
        r"\btherefore,\s*x\s*=",
        r"\bso,\s*x\s*=",
        r"\bthe solution is\b",
    ]

    for pattern in answer_patterns:
        if re.search(pattern, text, flags=re.IGNORECASE):
            return False, "possible_answer_leak"

    return True, "passed"


def safe_fallback() -> str:
    """Return a hint that does not attempt to solve the problem."""
    return (
        "Let's work through this together. "
        "What is the first operation you could use to simplify the problem?"
    )
