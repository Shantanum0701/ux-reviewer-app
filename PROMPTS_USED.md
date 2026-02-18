# LLM Prompts & Strategy

## Actual Production Prompt (Excerpt)

### System Prompt
You are a senior UX reviewer. Analyze the provided webpage content and identify UX issues grounded strictly in the provided evidence. Do not speculate or provide generic advice. Output valid JSON only.

### User Prompt Template
You are given:
- Extracted page content (title, headings, buttons, forms, visible text)
- Rendered page context

Tasks:
1. Identify 8–12 UX issues grouped by: clarity, layout, navigation, accessibility, trust.
2. For each issue:
   - Provide a short explanation
   - Cite exact evidence from the page (text or element description)
3. Identify the top 3 most severe issues and provide:
   - current_state
   - recommended_fix

Return only valid JSON matching the predefined schema.

## Deterministic Scoring (Demo Mode)

To ensure reviewability without API keys, the system includes a **Deterministic Mock Engine**.
- **Logic**: Heuristic based on issue density and category weights using deterministic seeding.
- **Purpose**: Provides consistent, variable scores for different URLs to demonstrate the UI's capability to handle varying data states.

## Why Multi-Modal Analysis?
Standard HTML parsing misses critical UX context like:
- **Visual Hierarchy**: Is the H1 actually prominent?
- **Contrast**: Is silver text on white readable?
- **Proximity**: Are related buttons grouped correctly?
Combining extracted DOM text with visual signals allows the AI to provide a holistic UX audit.
