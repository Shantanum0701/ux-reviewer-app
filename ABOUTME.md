# Your Name
Software Engineer | Full Stack Developer

## Project Reflections (UX Reviewer)

The most challenging technical decision was the **Database Choice**. 
Initially, I considered SQLite (via `better-sqlite3`) for simplicity. However, storing variability-rich JSON outputs from an LLM is a perfect use case for **MongoDB (Mongoose)**'s non-relational model. This switch allowed me to store:
- `result.top_severe_issues` (Complex Array)
- `result.category_breakdown` (Nested Objects)
...without designing extensive relational schemas.

## AI Engineering Approach

I treated the **LLM as an unreliable function component**.
- **Constraint**: Strict JSON schema ensures frontend never breaks.
- **Verification**: Prompt engineering forces "evidence" citation to ground hallucinations in reality.
- **Fallback**: A deterministic mock engine ensures UI/UX flows are testable even without burning API credits.

## If I had more time...
I would move the `puppeteer.launch()` calls to a **Job Queue (BullMQ/Redis)**. The current synchronous implementation holds the HTTP connection, which is risky for production (timeouts). An async polling architecture would solve this.
