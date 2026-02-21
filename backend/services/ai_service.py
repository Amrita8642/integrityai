import os
import json
import random
from dotenv import load_dotenv
from openai import OpenAI

# Load .env from backend folder
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

api_key = os.getenv("OPENAI_API_KEY")
print("LOADED KEY:", api_key)

client = OpenAI(api_key=api_key)


SYSTEM_PROMPT = """You are IntegrityAI, an academic integrity coach that helps students improve their work through learning rather than just detecting plagiarism.

Analyze the submitted text and return a JSON object with these exact keys:
- similarity_score: float 0-100
- ai_probability: float 0-100
- risk_level: "Low" | "Medium" | "High"
- learning_score: int 0-100
- feedback: string (2-3 sentences, friendly educational tone)
- improvement_tips: string (3-4 actionable tips)
- missing_citations: string

Be encouraging and educational.
"""

SYSTEM_PROMPT_HI = """आप IntegrityAI हैं, एक शैक्षणिक ईमानदारी कोच।

इन कुंजियों के साथ JSON लौटाएं:
- similarity_score
- ai_probability
- risk_level
- learning_score
- feedback
- improvement_tips
- missing_citations
"""


def run_integrity_check(content: str, language: str = "en") -> dict:
    system = SYSTEM_PROMPT_HI if language == "hi" else SYSTEM_PROMPT

    try:
        # Try real OpenAI call
        response = client.chat.completions.create(
            model="gpt-4o-mini",   # cheaper and safer
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": f"Analyze this academic submission:\n\n{content[:6000]}"},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=800,
        )

        result = json.loads(response.choices[0].message.content)

        return {
            "similarity_score": float(result.get("similarity_score", 0)),
            "ai_probability": float(result.get("ai_probability", 0)),
            "risk_level": result.get("risk_level", "Low"),
            "learning_score": int(result.get("learning_score", 50)),
            "feedback": result.get("feedback", ""),
            "improvement_tips": result.get("improvement_tips", ""),
            "missing_citations": result.get("missing_citations", "No missing citations detected"),
        }

    except Exception as e:
        # IMPORTANT: This handles quota error (429)
        print("OpenAI error → switching to DEMO mode:", e)

        # Demo fallback (for hackathon)
        similarity = random.randint(10, 35)
        ai_prob = random.randint(10, 40)

        if similarity < 20 and ai_prob < 30:
            risk = "Low"
        elif similarity > 60 or ai_prob > 70:
            risk = "High"
        else:
            risk = "Medium"

        return {
            "similarity_score": similarity,
            "ai_probability": ai_prob,
            "risk_level": risk,
            "learning_score": random.randint(60, 90),
            "feedback": "Demo mode: Your work shows good originality. Continue improving clarity and add references where necessary.",
            "improvement_tips": "Add proper citations; Rewrite complex sentences in your own words; Include examples to show understanding; Avoid copying structure from online sources.",
            "missing_citations": "Consider citing textbooks, research papers, or online sources if referenced.",
        }