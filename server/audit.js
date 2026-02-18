import puppeteer from "puppeteer";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-demo-mode"
});

export async function runAudit(url) {
    let browserInstance;

    try {
        /**
         * ======================================================
         * DEMO MODE — No LLM key provided
         * Purpose: UI + data-flow validation ONLY
         * ======================================================
         */
        if (!process.env.OPENAI_API_KEY) {
            console.log("[Audit] Running in DEMO MODE (No LLM)");

            // Deterministic demo issues (spec-compliant: 8–12 issues)
            const demoIssues = [
                { severity: "high", category: "accessibility" },
                { severity: "high", category: "clarity" },
                { severity: "medium", category: "navigation" },
                { severity: "medium", category: "layout" },
                { severity: "medium", category: "trust" },
                { severity: "low", category: "layout" },
                { severity: "low", category: "clarity" },
                { severity: "low", category: "navigation" }
            ];

            // UX score derived from issue severity (NOT random)
            let score = 100;
            for (const issue of demoIssues) {
                if (issue.severity === "high") score -= 10;
                if (issue.severity === "medium") score -= 5;
                if (issue.severity === "low") score -= 2;
            }
            score = Math.max(40, Math.min(score, 95));

            return {
                overall_score: score,
                summary_reasoning:
                    "The page demonstrates a solid baseline UX but shows several simulated issues across clarity, navigation, and accessibility. This score reflects the cumulative severity of those findings.",
                top_severe_issues: [
                    {
                        title: "Low Contrast Primary CTA",
                        severity: "high",
                        evidence: "Primary button text appears light against a white background",
                        current_state:
                            "The primary call-to-action lacks sufficient contrast, reducing visibility.",
                        recommended_fix:
                            "Increase contrast to meet WCAG AA standards by darkening the button text or background."
                    },
                    {
                        title: "Overloaded Top Navigation",
                        severity: "medium",
                        evidence: "Top navigation contains more than 7 visible menu items",
                        current_state:
                            "Too many navigation options increase cognitive load for users.",
                        recommended_fix:
                            "Group secondary links under a dropdown or move them to the footer."
                    },
                    {
                        title: "Unclear Hero Value Proposition",
                        severity: "medium",
                        evidence: "Hero headline does not clearly describe user benefit",
                        current_state:
                            "Users may not immediately understand what the product offers.",
                        recommended_fix:
                            "Rewrite the headline to emphasize a clear outcome or benefit."
                    }
                ],
                category_breakdown: {
                    clarity: [
                        { issue: "Vague headline", impact: "Users may struggle to understand the product quickly." },
                        { issue: "Generic CTA labels", impact: "Reduced conversion intent." }
                    ],
                    layout: [
                        { issue: "Hero image scaling", impact: "Content may crop on small screens." },
                        { issue: "Inconsistent spacing", impact: "Visual hierarchy is weakened." }
                    ],
                    navigation: [
                        { issue: "Too many menu items", impact: "Increases cognitive load." },
                        { issue: "No search option", impact: "Harder to find specific content." }
                    ],
                    accessibility: [
                        { issue: "Low contrast text", impact: "Fails accessibility guidelines." }
                    ],
                    trust: [
                        { issue: "Missing social proof", impact: "Reduces credibility for first-time visitors." }
                    ]
                }
            };
        }

        /**
         * ======================================================
         * PRODUCTION MODE — Real LLM Analysis
         * ======================================================
         */
        console.log(`[Audit] Running PRODUCTION audit for ${url}`);

        browserInstance = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browserInstance.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        const screenshotBase64 = await page.screenshot({
            encoding: "base64",
            type: "jpeg",
            quality: 60
        });

        const extractedContent = await page.evaluate(() => {
            const getText = (selector, limit = 5) =>
                Array.from(document.querySelectorAll(selector))
                    .slice(0, limit)
                    .map(el => el.innerText.trim())
                    .filter(Boolean);

            return {
                title: document.title,
                headings: getText("h1, h2, h3"),
                buttons: getText("button, a"),
                forms: getText("label")
            };
        });

        const prompt = `
You are a senior UX reviewer.

Analyze the provided webpage using ONLY the given content and rendered page context.

Tasks:
1. Identify 8–12 UX issues grouped across:
   clarity, layout, navigation, accessibility, trust.
2. Each issue MUST cite concrete evidence (exact text or element description).
3. Avoid generic advice. No assumptions.
4. Identify the top 3 most severe issues and provide before/after fixes.
5. Derive a UX score (0–100) based on issue severity and spread.

Return ONLY valid JSON with this structure:
{
  "overall_score": number,
  "summary_reasoning": "string",
  "top_severe_issues": [
    {
      "title": "string",
      "severity": "high | medium | low",
      "evidence": "string",
      "current_state": "string",
      "recommended_fix": "string"
    }
  ],
  "category_breakdown": {
    "clarity": [{ "issue": "string", "impact": "string" }],
    "layout": [{ "issue": "string", "impact": "string" }],
    "navigation": [{ "issue": "string", "impact": "string" }],
    "accessibility": [{ "issue": "string", "impact": "string" }],
    "trust": [{ "issue": "string", "impact": "string" }]
  }
}
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a UX auditing assistant. Output JSON only."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt + "\n\nExtracted Content:\n" + JSON.stringify(extractedContent, null, 2) },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${screenshotBase64}`,
                                detail: "low"
                            }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1500
        });

        return JSON.parse(response.choices[0].message.content);

    } catch (err) {
        console.error("[Audit] Failed:", err);
        throw err;
    } finally {
        if (browserInstance) await browserInstance.close();
    }
}
