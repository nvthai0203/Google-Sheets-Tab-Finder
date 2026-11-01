// Search Algorithm and Scoring

/**
 * Calculate match score for search query against text
 * @param {string} queryRaw - Search query
 * @param {string} textRaw - Text to match against
 * @returns {number} Match score (0-100)
 */
function scoreMatch(queryRaw, textRaw) {
    const q = normalize(queryRaw);
    const t = normalize(textRaw);

    if (!q) return 0;

    if (q === t) return CONFIG.SEARCH_SCORES.EXACT_MATCH;
    if (t.startsWith(q)) return CONFIG.SEARCH_SCORES.PREFIX_MATCH;

    const words = t.split(/\s+/);
    if (words.some((w) => w === q)) return CONFIG.SEARCH_SCORES.WORD_MATCH;
    if (t.includes(q)) return CONFIG.SEARCH_SCORES.SUBSTRING_MATCH;

    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) qi++;
    }

    if (qi === q.length) {
        const penalty = Math.min(
            CONFIG.SEARCH_SCORES.MAX_PENALTY,
            Math.floor((t.length - q.length) / 2)
        );
        return CONFIG.SEARCH_SCORES.SUBSEQUENCE_MATCH - penalty;
    }

    return 0;
}

function isBlankSearchQuery(query) {
    return !normalize(query || "");
}

function passesQuickFilter(li, quickFilter = "all") {
    const isHidden = li.dataset?.isHidden === "true";
    const isFavorite = li.dataset?.isFavorite === "true";
    return (
        quickFilter === "all" ||
        (quickFilter === "visible" && !isHidden) ||
        (quickFilter === "hidden" && isHidden) ||
        (quickFilter === "favorite" && isFavorite)
    );
}

function getListItemTabName(li) {
    return li.dataset?.tabName || li.querySelector?.("strong")?.textContent || "";
}

/**
 * Filter tab list items by query and quick filter.
 * Blank queries (including whitespace) show every item that passes the filter.
 * Non-blank queries are sorted by score descending.
 * @param {string} query
 * @param {HTMLElement[]} items
 * @param {{ quickFilter?: string }} [options]
 * @returns {Array<{ li: HTMLElement, score: number }>}
 */
function filterAndSortTabs(query, items, options = {}) {
    const quickFilter = options.quickFilter || "all";
    const blank = isBlankSearchQuery(query);
    const scored = [];

    items.forEach((li) => {
        const tabText = getListItemTabName(li);
        const score = blank ? 0 : scoreMatch(query, tabText);
        if (li.dataset) li.dataset.searchScore = String(score);

        const isHit = (blank || score > 0) && passesQuickFilter(li, quickFilter);
        if (li.style) li.style.display = isHit ? "block" : "none";
        li.classList?.remove?.("selected-tab");

        if (isHit) {
            scored.push({ li, score });
        }
    });

    if (!blank) {
        scored.sort((a, b) => b.score - a.score);
    }

    return scored;
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        scoreMatch,
        isBlankSearchQuery,
        passesQuickFilter,
        filterAndSortTabs
    };
}
