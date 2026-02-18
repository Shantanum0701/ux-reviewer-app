# AI Implementation Strategy

This document outlines the architecture and prompt engineering decisions made for the UX Reviewer.

## 🤖 Dual-Mode Architecture

To ensure this assignment is reviewable without requiring the reviewer to burn personal OpenAI credits, the system implements a **Dual-Mode Strategy**:

### 1. Production Mode (Primary Strategy)
*   **Model**: OpenAI GPT-4 Family.
*   **Input**: Extracted DOM content + Optional Visual Context (Screenshot).
*   **Prompt Strategy**: Constrained expert role. The LLM is instructed to act as a senior UX reviewer, focus on concrete problems, and justify every claim using page-specific evidence.
*   **Safety**: Input/Output validation ensures only JSON is returned to the frontend.

### 2. Demo Mode (Fallback Strategy)
To ensure the application remains fully reviewable even when external LLM access is unavailable, the system implements a dual-mode strategy.
*   **Purpose**: Allows full UI/UX testing and flow validation when API keys are not present.
*   **Mechanism**: A deterministic simulation engine.
*   **Scoring**: Heuristics based on issue density and category weights ensures that:
    *   `google.com` consistently scores high.
    *   `example.com` consistently scores lower.
*   **Data Generation**: Returns deterministic, structured placeholder results to validate UI rendering, data flow, and scoring logic.

## 🧠 Prompt Engineering (Production)

The prompt (located in `server/audit.js`) uses several techniques to reduce hallucination:

1.  **Role Constraint**: "You are a Senior UX Engineer."
2.  **Evidence Requirement**: "Cite specific text or elements visible in the screenshot."
3.  **Negative Constraints**: "Do NOT give generic advice."
4.  **Structured Output**: Enforced JSON schema for predictable frontend rendering.

## What I Verified Manually

- Page content extraction (headings, buttons, forms, visible text)
- UX issue grouping and severity mapping
- UX score calculation logic and variability
- Input validation and error handling
- Status page health checks (API, DB, LLM)

The LLM is used strictly for qualitative UX reasoning, not for application control flow or scoring logic.

## 🔮 Future Improvements

If this were taken beyond the scope of a hiring assignment, the synchronous analysis flow would be replaced with an asynchronous job queue (BullMQ/Redis) to handle Puppeteer and LLM latency more robustly.
