import re
import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))


def extract_json(text: str) -> dict:
    """Extract JSON from LLM response, tolerating markdown fences and surrounding prose."""
    # Strip markdown fences
    text = re.sub(r'```(?:json)?\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Balance-walk: find the outermost { ... } block
    depth = 0
    start_idx = None
    for i, ch in enumerate(text):
        if ch == '{':
            if depth == 0:
                start_idx = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start_idx is not None:
                candidate = text[start_idx:i + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    start_idx = None  # keep scanning for a later block

    raise ValueError(f"No valid JSON found in LLM response (first 500 chars): {text[:500]}")


def call_llm(system_prompt: str, user_message: str,
             temperature: float = 0.3, max_tokens: int = 2800) -> tuple[dict, int]:
    """Call Groq LLM with robust JSON extraction.  Retries once with stricter instruction."""
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    last_error: Exception | None = None

    for attempt in range(2):
        if attempt == 0:
            sys = system_prompt
            usr = user_message
        else:
            # Stricter retry: append hard JSON-only reminder to both prompts
            sys = (system_prompt
                   + "\n\nCRITICAL: Return ONLY a raw JSON object. "
                   "No markdown code fences, no backticks, no explanations. "
                   "Your entire response must start with { and end with }.")
            usr = user_message + "\n\nReturn raw JSON only — no markdown, no prose."

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": sys},
                {"role": "user",   "content": usr},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content
        tokens = response.usage.total_tokens

        try:
            result = extract_json(content)
            return result, tokens
        except (json.JSONDecodeError, ValueError) as e:
            last_error = e

    raise ValueError(
        f"LLM returned invalid JSON after 2 attempts. "
        f"Last error: {last_error}"
    )


def summarize_resources(resources: dict) -> str:
    """Return a compact text summary of available resources (saves ~1 K tokens)."""
    lines = []
    for category, units in resources.items():
        if not isinstance(units, list):
            continue
        ids = [u.get("id", "?") for u in units]
        avail = [u for u in units if u.get("status") in ("available", None)]
        lines.append(
            f"{category} ({len(avail)}/{len(units)} available): {', '.join(ids)}"
        )
    return "\n".join(lines)
