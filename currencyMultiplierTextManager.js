(function() {
    const priceRegex = /\$([\d,]+(?:\.\d{1,2})?)/g;
    const testRegex = /\$[\d,]+(?:\.\d{1,2})?/;
    const reviewCountRegex = /(\b\d+(?:,\d+)*\b)(?=\s*reviews?)/i;
    const ratingTextRegex = /(\b\d+(?:\.\d+)?\b)(?=\s*(?:tacos?|stars?))/i;
    const processedNodes = new WeakSet();
    let observer = null;
    let currentSettings = { minMultiplier: 1, maxMultiplier: 5, enabled: true };

    function parseCurrency(text) {
        const num = text.replace(/[\$,]/g, "");
        return parseFloat(num) || 0;
    }

    function generateMultiplier(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function formatPrice(orig, multiplier) {
        const newVal = orig * multiplier;
        return "$" + newVal.toFixed(2);
    }

    function replaceNodeText(node, newText) {
        node.textContent = newText;
    }

    function processText(text, min, max) {
        return text.replace(priceRegex, (match) => {
            const orig = parseCurrency(match);
            const mult = generateMultiplier(min, max);
            return formatPrice(orig, mult);
        });
    }

    function processReviewText(text) {
        let updated = text.replace(reviewCountRegex, '999');
        updated = updated.replace(ratingTextRegex, '1');
        return updated;
    }

    function handleTextNode(node, min, max) {
        if (processedNodes.has(node)) return;
        let text = node.textContent;
        let changed = false;

        if (testRegex.test(text)) {
            const replaced = processText(text, min, max);
            if (replaced !== text) {
                text = replaced;
                changed = true;
            }
        }

        const reviewReplaced = processReviewText(text);
        if (reviewReplaced !== text) {
            text = reviewReplaced;
            changed = true;
        }

        if (changed) {
            replaceNodeText(node, text);
            processedNodes.add(node);
        }
    }

    function walkAndReplace(min, max) {
        document.body.normalize();
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    if (!node.parentNode) return NodeFilter.FILTER_REJECT;
                    const tag = node.parentNode.nodeName;
                    if (["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(tag)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return testRegex.test(node.textContent)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                }
            },
            false
        );
        let node;
        while (node = walker.nextNode()) {
            handleTextNode(node, min, max);
        }
        updateRatingElements(document.body);
    }

    function observeMutations(min, max) {
        if (observer) observer.disconnect();
        observer = new MutationObserver(mutations => {
            for (const mut of mutations) {
                mut.addedNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        handleTextNode(node, min, max);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        const walker = document.createTreeWalker(
                            node,
                            NodeFilter.SHOW_TEXT,
                            {
                                acceptNode(n) {
                                    if (!n.parentNode) return NodeFilter.FILTER_REJECT;
                                    const tag = n.parentNode.nodeName;
                                    if (["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(tag)) {
                                        return NodeFilter.FILTER_REJECT;
                                    }
                                    return testRegex.test(n.textContent)
                                        ? NodeFilter.FILTER_ACCEPT
                                        : NodeFilter.FILTER_REJECT;
                                }
                            },
                            false
                        );
                        let subNode;
                        while (subNode = walker.nextNode()) {
                            handleTextNode(subNode, min, max);
                        }
                        updateRatingElements(node);
                    }
                });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function updateRatingElements(root) {
        const container = root instanceof Document ? root.body : root;
        if (!container) return;
        const ratingNodes = container.querySelectorAll('[aria-label*="taco" i], [class*="taco" i], [class*="rating" i]');
        ratingNodes.forEach(el => {
            if (el.dataset.ratingModified) return;
            el.dataset.ratingModified = 'true';
            el.textContent = '🌮';
        });
    }

    const dissuadeMessages = [
        'Are you sure you want this LTD?',
        'Nobody like this tool',
        'Think twice before buying.',
        "Don't waste your money.",
        'Join Ken Moo LTD group.'
    ];
    let lastScroll = 0;
    let overlayDiv = null;

    function createOverlay() {
        overlayDiv = document.createElement('div');
        overlayDiv.style.position = 'fixed';
        overlayDiv.style.bottom = '10%';
        overlayDiv.style.left = '50%';
        overlayDiv.style.transform = 'translateX(-50%)';
        overlayDiv.style.zIndex = '9999';
        overlayDiv.style.fontSize = '2rem';
        overlayDiv.style.fontWeight = 'bold';
        overlayDiv.style.color = '#b00';
        overlayDiv.style.background = 'rgba(255,255,255,0.9)';
        overlayDiv.style.padding = '10px 20px';
        overlayDiv.style.borderRadius = '8px';
        overlayDiv.style.display = 'none';
        overlayDiv.style.pointerEvents = 'none';
        document.body.appendChild(overlayDiv);
    }

    function showOverlayMessage() {
        if (!overlayDiv) createOverlay();
        const msg = dissuadeMessages[Math.floor(Math.random() * dissuadeMessages.length)];
        overlayDiv.textContent = msg;
        overlayDiv.style.display = 'block';
        clearTimeout(overlayDiv.hideTimer);
        overlayDiv.hideTimer = setTimeout(() => {
            overlayDiv.style.display = 'none';
        }, 2000);
    }

    function onScroll() {
        if (Math.abs(window.scrollY - lastScroll) > 200) {
            lastScroll = window.scrollY;
            showOverlayMessage();
        }
    }

    function init() {
        chrome.storage.sync.get(
            { minMultiplier: 1, maxMultiplier: 5, enabled: true },
            ({ minMultiplier, maxMultiplier, enabled }) => {
                currentSettings = { minMultiplier, maxMultiplier, enabled };
                if (enabled) {
                    walkAndReplace(minMultiplier, maxMultiplier);
                    observeMutations(minMultiplier, maxMultiplier);
                    updateRatingElements(document.body);
                    window.addEventListener('scroll', onScroll, { passive: true });
                } else {
                    if (observer) observer.disconnect();
                    window.removeEventListener('scroll', onScroll);
                    if (overlayDiv) overlayDiv.style.display = 'none';
                }
            }
        );
    }

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "sync" &&
            (changes.enabled || changes.minMultiplier || changes.maxMultiplier)) {
            document.body.normalize();
            init();
        }
    });

    init();
})();
