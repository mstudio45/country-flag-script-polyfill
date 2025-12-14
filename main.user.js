// ==UserScript==
// @name         Country Flags Polyfill
// @namespace    http://tampermonkey.net/
// @version      v1.0.0
// @description  Fixes all Country Flag emojis inside any text and canvas elements. Uses the country-flag-emoji-polyfill npmjs package.
// @author       mstudio45
// @match        *://*/*
// @grant        GM_addStyle
// @downloadURL  https://raw.githubusercontent.com/mstudio45/country-flag-script-polyfill/refs/heads/main/main.user.js
// @updateURL    https://raw.githubusercontent.com/mstudio45/country-flag-script-polyfill/refs/heads/main/main.user.js
// ==/UserScript==

(function() {
    // start polyfill //
    GM_addStyle(`@font-face {
  font-family: "Twemoji Country Flags";
  unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067, U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
  src: url("https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1/dist/TwemojiCountryFlags.woff2") format("woff2");
}`); // https://www.npmjs.com/package/country-flag-emoji-polyfill

    // options //
    const FLAG_REGEX = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/; // https://stackoverflow.com/questions/53360006/detect-with-regex-if-emoji-is-country-flag
    const origFillText = CanvasRenderingContext2D.prototype.fillText;
    const origStrokeText = CanvasRenderingContext2D.prototype.strokeText;

    // dom //
    function css(element, property) { // https://stackoverflow.com/questions/7444451/how-to-get-the-actual-rendered-font-when-its-not-defined-in-css
        return window.getComputedStyle(element, null).getPropertyValue(property);
    }

    function processTextNode(node) {
        if (!FLAG_REGEX.test(node.nodeValue)) return;

        const parent = node.parentElement;
        if (!parent) return;

        const originalFont = css(parent, "font-family");
        if (originalFont.indexOf(`"Twemoji Country Flags"`) !== -1) return;

        const newFont = originalFont ? `"Twemoji Country Flags", ${originalFont}` : `"Twemoji Country Flags"`;
        parent.style.fontFamily = newFont;
    }

    function walkDOM(root) {
        const nodes = Array.from(root.childNodes);
        for (const node of nodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                processTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                walkDOM(node);
            }
        }
    }

    walkDOM(document.body);
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    processTextNode(node);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    walkDOM(node);
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // canvas //
    function processDraw(ctx, text, x, y, maxWidth, drawFn) {
        if (!FLAG_REGEX.test(text)) return drawFn.call(ctx, text, x, y, maxWidth);

        const originalFont = ctx.font;
        if (originalFont.indexOf(`"Twemoji Country Flags"`) !== -1) return drawFn.call(ctx, text, x, y, maxWidth);

        const splits = originalFont.split("px ");
        const newFont = `${splits[0]}px "Twemoji Country Flags", ${splits[1]}`;

        ctx.font = newFont;
        return drawFn.call(ctx, text, x, y, maxWidth);
    }

    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
        return processDraw(this, text, x, y, maxWidth, origFillText);
    };

    CanvasRenderingContext2D.prototype.strokeText = function(text, x, y, maxWidth) {
        return processDraw(this, text, x, y, maxWidth, origStrokeText);
    };
})();
