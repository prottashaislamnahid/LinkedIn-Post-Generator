# PostForgeAI — LinkedIn Post Generator

> An AI-powered LinkedIn post generator built with **Gemini 2.5 Flash** (free tier) and **Flask**.  
> Fetches trending AI news, summarizes it, and generates ready-to-post LinkedIn content — all from a single web interface.

---

## Features

- **AI News Fetch** — Gemini generates a curated list of the top trending AI/ML news stories based on your search topic
- **GitHub Mode** — Switch to GitHub mode to surface trending open-source AI repositories instead
- **4 Style Presets** — Professional, Conversational, Bold, and Creative — each with tuned temperature and top-p values
- **Custom Parameters** — Override temperature (0–2.0), top-p, and max tokens with live sliders
- **Author & Goal Control** — Customize your persona and what the post should achieve
- **Hashtag & CTA Toggles** — Toggle hashtags and call-to-action questions on/off
- **One-Click Copy** — Copy the generated post to clipboard instantly
- **Keyboard Shortcut** — `Ctrl+Enter` to generate a post without touching the mouse
- **Dark UI** — Clean, responsive dark-mode interface built with vanilla HTML/CSS/JS

---

## Project Structure

```
linkedin_post_generator/
├── app.py                  # Flask backend — all Gemini logic and API routes
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── .gitignore
├── templates/
│   └── index.html          # Main UI (single-page)
└── static/
    ├── css/
    │   └── style.css       # Full custom dark theme
    └── js/
        └── main.js         # Frontend logic (fetch, generate, copy, sliders)
```

---

## Prerequisites

- Python 3.10 or higher
- A free Gemini API key → [Get one at Google AI Studio](https://aistudio.google.com)
- VS Code (recommended) or any terminal

---

## Setup & Installation

### 1. Download and extract the project

Unzip `linkedin_post_generator.zip` into a folder of your choice.

### 2. Open in VS Code

```
File → Open Folder → select the linkedin_post_generator folder
```

### 3. Create and activate a virtual environment

Open the integrated terminal in VS Code (`Ctrl + `` ` ``):

```bash
# Create virtual environment
python -m venv venv

# Activate — Windows
venv\Scripts\activate

# Activate — macOS / Linux
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Set your Gemini API key

Copy `.env.example` to a new file named `.env`:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and paste your key:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 6. Run the app

```bash
python app.py
```

You should see:

```
✅ Gemini API key loaded. Model: gemini-2.5-flash
 * Running on http://127.0.0.1:5000
```

### 7. Open in your browser

```
http://localhost:5000
```

---

## How to Use

1. **Enter a topic** — e.g. `AI agents 2025`, `large language models`, `open source LLM`
2. **Choose a source** — News (AI news stories) or GitHub (trending repositories)
3. **Set the number of results** — drag the slider between 3 and 10
4. **Click "Fetch News"** — Gemini generates the content and displays it in the center panel
5. **Pick a style preset** — choose Professional, Conversational, Bold, or Creative
6. **Optionally adjust** — custom sliders, author context, post goal, hashtag/CTA toggles
7. **Click "Generate LinkedIn Post"** (or press `Ctrl+Enter`) — your post appears on the right
8. **Copy and post** — click "Copy Post" and paste directly into LinkedIn

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Serves the main UI |
| `POST` | `/api/fetch-news` | Fetches news or GitHub repos via Gemini |
| `POST` | `/api/generate-post` | Generates a LinkedIn post from content |
| `GET` | `/api/presets` | Returns available style presets |

### Example — Fetch News

```bash
curl -X POST http://localhost:5000/api/fetch-news \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI agents", "num_results": 5, "source": "news"}'
```

### Example — Generate Post

```bash
curl -X POST http://localhost:5000/api/generate-post \
  -H "Content-Type: application/json" \
  -d '{
    "content": "OpenAI released GPT-5 with major reasoning improvements...",
    "preset": "bold",
    "include_hashtags": true,
    "include_cta": true
  }'
```

---

## Style Presets

| Preset | Temperature | Top-p | Best For |
|--------|-------------|-------|----------|
| Professional | 0.3 | 0.85 | Corporate announcements, formal insights |
| Conversational | 0.7 | 0.90 | Day-to-day posts, relatable takes |
| Bold | 1.0 | 0.95 | Hot takes, opinion pieces |
| Creative | 1.3 | 0.98 | Unique angles, storytelling hooks |

---

## Important Notes

- **Free tier safe** — this project uses zero paid APIs. No Google Search grounding, no HackerNews, no Reddit, no GitHub API. Everything runs through the Gemini text generation endpoint only.
- **No `requests` library used** — all content (news summaries and GitHub repos) is generated by Gemini based on its training knowledge.
- **API key security** — never commit your `.env` file. It is already listed in `.gitignore`.
- **Rate limits** — the free Gemini tier has per-minute request limits. If you hit a 429 error, wait 30–60 seconds and try again.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `GEMINI_API_KEY not set` | `.env` file missing or wrong key name | Copy `.env.example` to `.env` and add your key |
| `429 RESOURCE_EXHAUSTED` | Free tier rate limit hit | Wait 60 seconds and try again |
| `ModuleNotFoundError` | Dependencies not installed | Run `pip install -r requirements.txt` with venv active |
| `Address already in use` | Port 5000 is taken | Run `python app.py` after killing the other process, or change port in `app.py` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Gemini 2.5 Flash (`gemini-2.5-flash`) |
| AI SDK | `google-genai` Python SDK |
| Backend | Flask 3.x |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Fonts | Syne, DM Mono, DM Sans (Google Fonts) |
| Environment | python-dotenv |

---

## License

This project was built for the **AI Engineering MasterClass** as a learning project. Free to use and modify for personal and educational purposes.
