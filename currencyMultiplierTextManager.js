(function() {
    const priceRegex = /\$([\d,]+(?:\.\d{1,2})?)/g;
    const testRegex = /\$[\d,]+(?:\.\d{1,2})?/;
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

    function handleTextNode(node, min, max) {
        if (processedNodes.has(node)) return;
        if (!testRegex.test(node.textContent)) return;
        const newText = processText(node.textContent, min, max);
        if (newText !== node.textContent) {
            replaceNodeText(node, newText);
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
                    }
                });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        chrome.storage.sync.get(
            { minMultiplier: 1, maxMultiplier: 5, enabled: true },
            ({ minMultiplier, maxMultiplier, enabled }) => {
                currentSettings = { minMultiplier, maxMultiplier, enabled };
                if (enabled) {
                    walkAndReplace(minMultiplier, maxMultiplier);
                    observeMutations(minMultiplier, maxMultiplier);
                } else if (observer) {
                    observer.disconnect();
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