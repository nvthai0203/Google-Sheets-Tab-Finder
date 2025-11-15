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
    
    // Exact match
    if (q === t) return CONFIG.SEARCH_SCORES.EXACT_MATCH;
    
    // Prefix match
    if (t.startsWith(q)) return CONFIG.SEARCH_SCORES.PREFIX_MATCH;
    
    // Word match (whole word)
    const words = t.split(/\s+/);
    if (words.some(w => w === q)) return CONFIG.SEARCH_SCORES.WORD_MATCH;
    
    // Substring match
    if (t.includes(q)) return CONFIG.SEARCH_SCORES.SUBSTRING_MATCH;
    
    // Subsequence match (fuzzy)
    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) qi++;
    }
    
    if (qi === q.length) {
        // Penalize based on length difference
        const penalty = Math.min(
            CONFIG.SEARCH_SCORES.MAX_PENALTY,
            Math.floor((t.length - q.length) / 2)
        );
        return CONFIG.SEARCH_SCORES.SUBSEQUENCE_MATCH - penalty;
    }
    
    return 0;
}

/**
 * Filter and sort tab list items based on search query
 * @param {string} query - Search query
 * @param {HTMLElement[]} items - List items to filter
 * @returns {Array} Sorted items with scores
 */
function filterAndSortTabs(query, items) {
    const scored = [];
    
    items.forEach(li => {
        const tabText = li.querySelector('strong').textContent;
        const score = scoreMatch(query, tabText);
        li.dataset.searchScore = String(score);
        
        const isHit = score > 0 || query === '';
        li.style.display = isHit ? 'block' : 'none';
        li.classList.remove('selected-tab');
        
        if (isHit) {
            scored.push({ li, score });
        }
    });
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    return scored;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        scoreMatch,
        filterAndSortTabs
    };
}
