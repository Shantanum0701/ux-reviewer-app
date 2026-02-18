# UX Reviewer App
**Evaluation-Ready Full Stack Application**

A minimal, high-impact tool that audits web pages for UX/UI best practices, focusing on contrast, layout, and clarity. 

## 🚀 Key Features

*   **Automated Audits**: Puppeteer screenshots URLs to capture visual context.
    *   **AI Analysis**:
        *   **Production Mode (Primary)**: Uses OpenAI GPT-4 family to generate page-specific UX issues grounded in extracted content and layout signals.
        *   **Demo Mode (Fallback)**: If no API key is provided, the app runs in a deterministic heuristic mode to ensure the UI and data flow remain testable without external dependencies.
*   **System Status**: Realtime health check dashboard for Database, API, and AI status.
*   **History**: Tracks and stores past audits in MongoDB.

## 🛠️ Tech Stack & Tradeoffs

*   **Frontend**: React + Vite + Tailwind CSS. *Why: Instant HMR and modern component architecture.*
*   **Backend**: Node.js + Express.
*   **Database**: MongoDB (Mongoose). *Why: Flexible schema for storing variable JSON results from LLMs.*
*   **Browser Automation**: Puppeteer. *Tradeoff: Heavier resource usage than `fetch`, but required to render client-side applications and extract visible text, structure, and layout signals. Screenshots are captured for future extensibility but are not used for pixel-level UX judgments in this version.*

## ⚙️ Configuration

1.  **Start the App**
    ```bash
    ./start_app.bat
    ```
    This launches both client (port 5173) and server (port 3000).

2.  **Environment Variables (`server/.env`)**
    *   `MONGODB_URI`: Connection string (default: local).
    *   `OPENAI_API_KEY`: *Optional*. If missing, app runs in **Demo Mode**.

## 🧠 AI & Scoring Logic

*   **Scoring Heuristic**: The UX score is a deterministic heuristic derived from number of issues detected, severity weights, and distribution across UX categories. This produces consistent but non-arbitrary scores while avoiding overclaiming statistical validity.
*   **Prompt Engineering**: The system uses a strict structured prompt forbidding generic advice. It forces the LLM to cite specific text/elements ("evidence") visible in the screenshot to verify its claims.

## ✅ Reviewer Checklist

- [ ] **Status Page**: Check "System Status" in the top right.
- [ ] **Demo Mode**: Confirm "AI Engine" shows "Demo Mode" (Yellow) if no key is set.
- [ ] **Audit**: Run a URL. Notice specific "Source Element" citations in the report.
- **Code Review**: Check `server/audit.js` for the Mock/Production logic switch.
- **AI Engine**: OpenAI GPT-4 family (text-based analysis with optional visual context).
## Tradeoffs & Constraints

1. **Synchronous Scraping**: The analysis currently keeps the HTTP request open while scraping (long-polling approach). In a production environment, this would be decoupled into a job queue (Redis/Bull) with webhooks.
2. **Puppeteer Dependency**: Requires a Chromium download. In a serverless cloud (Vercel/AWS Lambda), this would require a specialized layer (e.g., `chrome-aws-lambda`).

## License
MIT
