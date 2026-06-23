import os
import warnings
from flask import Flask, render_template, request, jsonify

from google import genai
from google.genai import types
from dotenv import load_dotenv

warnings.filterwarnings("ignore")
load_dotenv()

app = Flask(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = "gemini-2.5-flash-lite"

PRESETS = {
    "professional": {"temperature": 0.3, "top_p": 0.85, "description": "Polished, corporate tone"},
    "conversational": {"temperature": 0.7, "top_p": 0.9, "description": "Friendly, relatable"},
    "bold": {"temperature": 1.0, "top_p": 0.95, "description": "Opinionated, attention-grabbing"},
    "creative": {"temperature": 1.3, "top_p": 0.98, "description": "Unique hooks, unexpected angles"},
}


def search_trending_news(topic: str, num_results: int = 10) -> str:
    prompt = (
        f"You are an AI news researcher. Generate a list of the top {num_results} "
        f"most important and trending recent news stories about: '{topic}'.\n\n"
        f"For each story write:\n"
        f"[number]. **Headline** (make it realistic and specific)\n"
        f"Summary: 2-3 sentences explaining what happened and why it matters.\n"
        f"Source: (realistic publication e.g. VentureBeat, TechCrunch, The Verge, Wired, MIT Tech Review)\n\n"
        f"Focus on real trends, company announcements, research breakthroughs, and industry developments "
        f"in the AI/ML space. Be specific with names, numbers, and facts. "
        f"Format each item clearly with a blank line between items."
    )
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        # config=types.GenerateContentConfig(
        #     temperature=0.6,
        #     max_output_tokens=2000,
        #     thinking_config=types.ThinkingConfig(thinking_budget=0),
        # ),
    )
    return response.text


def search_github_repos(query: str, num_results: int = 5) -> str:
    prompt = (
        f"You are a GitHub trending repositories analyst. List the top {num_results} "
        f"most popular and relevant GitHub repositories for: '{query}'.\n\n"
        f"For each repo write:\n"
        f"- **owner/repo-name** (X,XXX stars)\n"
        f"  Description: one clear sentence about what it does.\n"
        f"  Language: [primary language] | URL: https://github.com/owner/repo-name\n"
        f"  Why it's trending: 1-2 sentences on recent activity or why developers love it.\n\n"
        f"Use realistic repo names, star counts, and descriptions based on actual well-known "
        f"open-source AI/ML projects. Include a blank line between repos."
    )
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        # config=types.GenerateContentConfig(
        #     temperature=0.4,
        #     max_output_tokens=1500,
        #     thinking_config=types.ThinkingConfig(thinking_budget=0),
        # ),
    )
    return response.text


def generate_linkedin_post(
    content, preset="conversational", custom_temperature=None, custom_top_p=None,
    max_tokens=500, author_context="an AI engineer sharing practitioner insights",
    post_goal="educate and spark discussion", include_hashtags=True, include_cta=True,
) -> str:
    config = PRESETS.get(preset, PRESETS["conversational"])
    temperature = custom_temperature if custom_temperature is not None else config["temperature"]
    top_p = custom_top_p if custom_top_p is not None else config["top_p"]

    system_prompt = (
        f"You are {author_context}. Write a LinkedIn post to {post_goal}. Rules: "
        f"- Start with a strong hook line that grabs attention "
        f"- Share a practitioner insight, NOT a news roundup "
        f"- Use short paragraphs (1-2 sentences each) "
        f"- Include a personal take or lesson learned "
        f"{'- End with 3-5 relevant hashtags' if include_hashtags else ''} "
        f"{'- Include a call-to-action question at the end' if include_cta else ''} "
        f"- Keep it under 200 words - No emojis overload, max 2-3 total - Sound human, not AI-generated"
    )

    response = client.models.generate_content(
        model=MODEL,
        contents=f"Based on this content, write a LinkedIn post:\n\n{content}",
        # config=types.GenerateContentConfig(
        #     system_instruction=system_prompt,
        #     temperature=temperature,
        #     top_p=top_p,
        #     max_output_tokens=max_tokens,
        #     thinking_config=types.ThinkingConfig(thinking_budget=0),
        # ),
    )
    return response.text


@app.route("/")
def index():
    return render_template("index.html", presets=PRESETS)


@app.route("/api/fetch-news", methods=["POST"])
def api_fetch_news():
    data = request.get_json()
    topic = data.get("topic", "AI revolution artificial intelligence 2025")
    num_results = int(data.get("num_results", 10))
    source = data.get("source", "news")
    try:
        content = search_github_repos(topic, num_results=min(num_results, 10)) \
            if source == "github" else search_trending_news(topic, num_results=num_results)
        return jsonify({"success": True, "content": content})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/generate-post", methods=["POST"])
def api_generate_post():
    data = request.get_json()
    content = data.get("content", "")
    if not content.strip():
        return jsonify({"success": False, "error": "Content is required."}), 400
    preset = data.get("preset", "conversational")
    custom_temperature = data.get("custom_temperature")
    custom_top_p = data.get("custom_top_p")
    max_tokens = int(data.get("max_tokens", 500))
    try:
        post = generate_linkedin_post(
            content=content, preset=preset,
            custom_temperature=float(custom_temperature) if custom_temperature is not None else None,
            custom_top_p=float(custom_top_p) if custom_top_p is not None else None,
            max_tokens=max_tokens,
            author_context=data.get("author_context", "an AI engineer sharing practitioner insights"),
            post_goal=data.get("post_goal", "educate and spark discussion"),
            include_hashtags=data.get("include_hashtags", True),
            include_cta=data.get("include_cta", True),
        )
        config = PRESETS.get(preset, PRESETS["conversational"])
        return jsonify({
            "success": True, "post": post,
            "config": {
                "preset": preset,
                "temperature": float(custom_temperature) if custom_temperature is not None else config["temperature"],
                "top_p": float(custom_top_p) if custom_top_p is not None else config["top_p"],
                "max_tokens": max_tokens,
            },
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/presets", methods=["GET"])
def api_presets():
    return jsonify(PRESETS)


if __name__ == "__main__":
    if not GEMINI_API_KEY:
        print("⚠️  WARNING: GEMINI_API_KEY not set. Copy .env.example to .env and add your key.")
    else:
        print(f"✅ Gemini API key loaded. Model: {MODEL}")
    app.run(debug=True, port=5000)