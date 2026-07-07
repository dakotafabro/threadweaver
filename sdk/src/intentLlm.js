import { inferRecallIntent } from "./intent.js";
function normalizeFromLlm(raw) {
    const mode = raw?.mode === "recent" ? "recent" : "recall";
    const query = typeof raw?.query === "string" ? raw.query.trim() : "";
    const projectHint = typeof raw?.projectHint === "string" && raw.projectHint.trim() ? raw.projectHint.trim() : undefined;
    const buildTopic = typeof raw?.buildTopic === "string" && raw.buildTopic.trim() ? raw.buildTopic.trim() : undefined;
    let confidence = Number(raw?.confidence ?? 0.75);
    if (!Number.isFinite(confidence))
        confidence = 0.75;
    confidence = Math.max(0, Math.min(0.99, confidence));
    const reasons = Array.isArray(raw?.reasons) ? raw.reasons.map((r) => String(r)) : ["llm-intent-parse"];
    return { mode, query, projectHint, buildTopic, confidence, reasons };
}
function normalizeBaseUrl(input) {
    if (input.endsWith("/"))
        return input.slice(0, -1);
    return input;
}
export async function inferRecallIntentWithLlm(utterance, opts = {}) {
    const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey)
        return inferRecallIntent(utterance);
    const baseUrlRaw = opts.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    const baseUrl = normalizeBaseUrl(baseUrlRaw);
    const model = opts.model ?? process.env.THREADWEAVER_INTENT_MODEL ?? "gpt-4.1-mini";
    const system = [
        "Extract recall intent for a consent-first memory tool.",
        "Return JSON only with keys: mode, query, projectHint, buildTopic, confidence, reasons.",
        "mode must be recall or recent.",
        "query should preserve user meaning and remove orchestration filler.",
        "confidence is 0..1.",
        "reasons is short machine-readable strings."
    ].join(" ");
    const response = await fetch(baseUrl + "/chat/completions", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: "Bearer " + apiKey
        },
        body: JSON.stringify({
            model,
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: system },
                { role: "user", content: utterance }
            ]
        })
    });
    if (!response.ok)
        return inferRecallIntent(utterance);
    const payload = (await response.json());
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim())
        return inferRecallIntent(utterance);
    try {
        const parsed = JSON.parse(content);
        const normalized = normalizeFromLlm(parsed);
        if (!normalized.query)
            return inferRecallIntent(utterance);
        return normalized;
    }
    catch {
        return inferRecallIntent(utterance);
    }
}
