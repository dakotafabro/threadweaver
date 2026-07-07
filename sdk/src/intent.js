function normalizeWhitespace(input) {
    return input
        .split(" ")
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .join(" ")
        .trim();
}
function stripTrailingPunctuation(input) {
    let out = input.trim();
    while (out.endsWith(".") || out.endsWith(",") || out.endsWith(";") || out.endsWith("!") || out.endsWith("?")) {
        out = out.slice(0, -1).trim();
    }
    return out;
}
function lower(input) {
    return normalizeWhitespace(input).toLowerCase();
}
function earliestIndex(haystack, markers) {
    let best = -1;
    for (const marker of markers) {
        const idx = haystack.indexOf(marker);
        if (idx >= 0 && (best < 0 || idx < best))
            best = idx;
    }
    return best;
}
function inferMode(utterance, reasons) {
    const low = lower(utterance);
    if (low.includes(" recent") || low.startsWith("recent") || low.includes(" latest") || low.includes(" newest")) {
        reasons.push("mode-recent-token");
        return "recent";
    }
    reasons.push("mode-default-recall");
    return "recall";
}
function inferQuery(utterance, reasons) {
    const src = normalizeWhitespace(utterance);
    const srcLow = src.toLowerCase();
    let base = src;
    const aboutMarker = "about ";
    const aboutAt = srcLow.indexOf(aboutMarker);
    if (aboutAt >= 0) {
        base = src.slice(aboutAt + aboutMarker.length);
        reasons.push("query-from-about-clause");
    }
    const baseLow = base.toLowerCase();
    const cut = earliestIndex(baseLow, [
        " and show overlap",
        " and how overlap",
        " and overlap",
        " and correlate",
        " and connect",
        " with build",
        " build about",
        " project "
    ]);
    const narrowed = cut >= 0 ? base.slice(0, cut) : base;
    const query = stripTrailingPunctuation(normalizeWhitespace(narrowed));
    if (query !== src)
        reasons.push("query-normalized");
    return query || src;
}
function inferProjectHint(utterance, reasons) {
    const src = normalizeWhitespace(utterance);
    const srcLow = src.toLowerCase();
    const marker = "project ";
    const p = srcLow.indexOf(marker);
    if (p >= 0) {
        const rest = src.slice(p + marker.length);
        const restLow = rest.toLowerCase();
        const cut = earliestIndex(restLow, [" and ", " with ", " build ", ".", "?", "!"]);
        const hint = stripTrailingPunctuation(normalizeWhitespace(cut >= 0 ? rest.slice(0, cut) : rest));
        if (hint) {
            reasons.push("project-hint-explicit");
            return hint;
        }
    }
    const known = ["aaif ambassador", "bitcoin", "eleventh house studios", "chatgpt general", "chatgpt-general"];
    const lowAll = srcLow;
    for (const k of known) {
        if (lowAll.includes(k)) {
            reasons.push("project-hint-known-name");
            return k;
        }
    }
    return undefined;
}
function inferBuildTopic(utterance, reasons) {
    const src = normalizeWhitespace(utterance);
    const srcLow = src.toLowerCase();
    const markers = ["build about ", "build on ", "build for "];
    for (const marker of markers) {
        const at = srcLow.indexOf(marker);
        if (at >= 0) {
            const rest = src.slice(at + marker.length);
            const restLow = rest.toLowerCase();
            const cut = earliestIndex(restLow, [" and ", " project ", ".", "?", "!"]);
            const topic = stripTrailingPunctuation(normalizeWhitespace(cut >= 0 ? rest.slice(0, cut) : rest));
            if (topic) {
                reasons.push("build-topic-explicit");
                return topic;
            }
        }
    }
    return undefined;
}
export function inferRecallIntent(utterance) {
    const reasons = [];
    const mode = inferMode(utterance, reasons);
    const query = inferQuery(utterance, reasons);
    const projectHint = inferProjectHint(utterance, reasons);
    const buildTopic = inferBuildTopic(utterance, reasons);
    let confidence = 0.55;
    if (query.length > 0)
        confidence += 0.2;
    if (projectHint)
        confidence += 0.15;
    if (buildTopic)
        confidence += 0.05;
    if (lower(utterance).includes("chatgpt"))
        confidence += 0.05;
    if (confidence > 0.98)
        confidence = 0.98;
    return { mode, query, projectHint, buildTopic, confidence, reasons };
}
function tokens(input) {
    return new Set(input
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .map((t) => t.trim())
        .filter((t) => t.length > 2));
}
export function correlateWithBuild(rows, buildContext) {
    const buildTokens = tokens(buildContext);
    const correlated = [];
    for (const row of rows) {
        const corpus = row.threadTitle + " " + (row.excerpt ?? "");
        const rowTokens = tokens(corpus);
        const overlap = [...rowTokens].filter((t) => buildTokens.has(t));
        if (!overlap.length)
            continue;
        correlated.push({
            threadId: row.threadId,
            threadTitle: row.threadTitle,
            projectName: row.projectName,
            overlap: overlap.slice(0, 12),
            score: overlap.length
        });
    }
    correlated.sort((a, b) => b.score - a.score);
    return correlated;
}
