
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from groq import Groq

from backend.prompts import BASE_SYSTEM_PROMPT, TUTOR_SYSTEM_PROMPT
from backend.guardrails import validate_tutor_response, safe_fallback

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

if not api_key:
    raise RuntimeError(
        "GROQ_API_KEY is missing. Add it to your .env file."
    )

client = Groq(api_key=api_key)

app = FastAPI(
    title="Guarded AI Math Tutor",
    description="A prototype comparing direct AI assistance with guided tutoring.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    mode: str
    response: str
    guardrail_status: str


def generate_response(system_prompt: str, message: str) -> str:
    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            temperature=0.2,
            max_tokens=250,
        )

        content = completion.choices[0].message.content
        return (content or "").strip()

    except Exception as exc:
        # Do not expose provider details or credentials to the client.
        print(f"Groq request failed: {type(exc).__name__}")
        raise HTTPException(
            status_code=502,
            detail="The AI provider could not complete the request.",
        ) from exc


@app.get("/health")
def health():
    return {"status": "ok", "model": model_name}


@app.post("/api/base/chat", response_model=ChatResponse)
def base_chat(request: ChatRequest):
    response = generate_response(BASE_SYSTEM_PROMPT, request.message)

    return ChatResponse(
        mode="base",
        response=response,
        guardrail_status="not_applicable",
    )


@app.post("/api/tutor/chat", response_model=ChatResponse)
def tutor_chat(request: ChatRequest):
    response = generate_response(TUTOR_SYSTEM_PROMPT, request.message)

    passed, reason = validate_tutor_response(response)

    if not passed:
        response = safe_fallback()
        status = f"fallback:{reason}"
    else:
        status = "passed_basic_checks"

    return ChatResponse(
        mode="tutor",
        response=response,
        guardrail_status=status,
    )
