// ==UserScript==
// @name         JPDB Detailed Kanji Keywords
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Update JPDB kanji keywords to detailed way similar to Jisho
// @match        *://*/*
// @author       FELIXZsブワ
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';
        GM_addStyle(`
         /* Keep our long glosses from destroying the grid */
        .subsection-composed-of-kanji .description {
            white-space: normal !important;   /* allow wrapping               */
            overflow-wrap: anywhere;          /* break inside words if needed */
            max-width: 18rem;                 /* don’t let it grow forever    */
        }

        /* Make sure kana readings stay on one line */
       .subsection-readings .spelling a {
           white-space: nowrap !important;
       }
    `);

    let kanjiMeanings = null;

    function replaceKanjiMeanings() {
        const container = document.querySelector('.subsection-composed-of-kanji .subsection');
        if (!container) return;

        const pairDivs = container.children;
        Array.from(pairDivs).forEach(pairDiv => {
            const spellingLink = pairDiv.querySelector('.spelling a');
            const descriptionDiv = pairDiv.querySelector('.description');
            if (descriptionDiv.dataset.modified === 'true') return;
            if (spellingLink && descriptionDiv) {
                const kanji = spellingLink.textContent.trim();
                const newMeaningRaw = kanjiMeanings[kanji];
                if (newMeaningRaw) {
                    const originalText = descriptionDiv.textContent.trim();
                    const originalFirstWord = originalText.split(/[,;]/)[0].trim();
                    const newMeaning = newMeaningRaw
                    .split(/[,;]/)
                    .map(word => word.trim())
                    .filter(word => word.toLowerCase() !== originalFirstWord.toLowerCase())
                    .join(', ');

                    const formatted = newMeaning
                    ? `<b>${"(" + originalFirstWord + ") -"}</b> ${newMeaning}`
                    : `<b>${"(" + originalFirstWord + ")"}</b>`;

                    descriptionDiv.innerHTML = formatted;
                    descriptionDiv.dataset.modified = 'true';
                }
            }
        });
    }

    function fetchKanjiMeanings(callback) {
        const storedMeanings = GM_getValue('kanjiMeanings');
        if (storedMeanings) {
            kanjiMeanings = JSON.parse(storedMeanings);
            callback();
        } else {
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://cdn.jsdelivr.net/gh/felix-ops/kanji-dictionary/kanji-dictionary.json',
                onload: function(response) {
                    if (response.status === 200) {
                        kanjiMeanings = JSON.parse(response.responseText);
                        GM_setValue('kanjiMeanings', JSON.stringify(kanjiMeanings));
                        callback();
                    }
                }
            });
        }
    }

    fetchKanjiMeanings(() => {
        replaceKanjiMeanings();
    });
})();
