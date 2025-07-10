// Auto-create curtains for iframes on current slide in Quarto reveal.js
(function() {
    let curtains = new Map(); // Track created curtains
    let resizeObservers = new Map(); // Track resize observers
    let mutationObservers = new Map(); // Track mutation observers

    function createCurtain(iframe) {
        // Create curtain div
        const curtain = document.createElement('div');
        curtain.className = 'curtain';
        curtain.style.position = 'absolute';
        curtain.style.backgroundColor = 'rgba(100, 0, 0, 0.7)';
        curtain.style.zIndex = '10';
        curtain.style.pointerEvents = 'none'; // Optional: allows clicks to pass through
        curtain.style.visibility = 'hidden';

        // Insert curtain after iframe
        iframe.parentNode.insertBefore(curtain, iframe.nextSibling);
        
        return curtain;
    }

    function updateCurtain(iframe, curtain) {
        if (!iframe || !curtain) return;
        
        const iframeRect = iframe.getBoundingClientRect();
        const parentRect = iframe.parentNode.getBoundingClientRect();
        
        
        // Calculate curtain dimensions (60% height, same width)
        const curtainWidth = iframe.offsetWidth;
        const curtainHeight = iframe.offsetHeight * 0.68;
        
        // Position 20% from top of iframe
        // const curtainTop = iframe.offsetTop + (iframe.offsetHeight * 0.2);
        // const curtainLeft = iframe.offsetLeft;

        // const curtainLeft = iframeRect.left - parentRect.left;
        const curtainLeft = 0;
        const curtainTop = (iframeRect.top - parentRect.top) + (iframe.offsetHeight * 0.16);
        
        // Apply styles
        curtain.style.width = curtainWidth + 'px';
        curtain.style.height = curtainHeight + 'px';
        curtain.style.top = curtainTop + 'px';
        curtain.style.left = curtainLeft + 'px';
    }

    function setupCurtainForIframe(iframe) {
        const iframeId = iframe.id || iframe.src || Math.random().toString(36);
        
        // Skip if already has curtain
        if (curtains.has(iframeId)) {
            return;
        }
        
        // Make sure iframe parent has relative positioning
        const parent = iframe.parentNode;
        if (getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }

        // Create curtain
        const curtain = createCurtain(iframe);
        curtains.set(iframeId, curtain);
        
        // Initial update
        updateCurtain(iframe, curtain);
        
        // Set up ResizeObserver for iframe size changes
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === iframe) {
                    updateCurtain(iframe, curtain);
                }
            }
        });
        resizeObserver.observe(iframe);
        resizeObservers.set(iframeId, resizeObserver);
        
        // Set up MutationObserver for attribute changes
        const mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'width' || 
                     mutation.attributeName === 'height' ||
                     mutation.attributeName === 'style')) {
                    updateCurtain(iframe, curtain);
                }
            });
        });
        mutationObserver.observe(iframe, {
            attributes: true,
            attributeFilter: ['width', 'height', 'style']
        });
        mutationObservers.set(iframeId, mutationObserver);
    }

    function cleanupCurtains() {
        // Remove all curtains and observers
        curtains.forEach((curtain, iframeId) => {
            if (curtain.parentNode) {
                curtain.parentNode.removeChild(curtain);
            }
            
            // Clean up observers
            const resizeObserver = resizeObservers.get(iframeId);
            if (resizeObserver) {
                resizeObserver.disconnect();
                resizeObservers.delete(iframeId);
            }
            
            const mutationObserver = mutationObservers.get(iframeId);
            if (mutationObserver) {
                mutationObserver.disconnect();
                mutationObservers.delete(iframeId);
            }
        });
        
        curtains.clear();
    }

    function handleSlideChange() {
        // Clean up existing curtains
        // cleanupCurtains();
        
        // Find current slide (section with class 'present')
        const currentSlide = document.querySelector('section.present');
        if (!currentSlide) return;
        
        // Find all iframes in current slide
        const iframes = currentSlide.querySelectorAll('iframe');
        
        // Create curtains for each iframe
        iframes.forEach(iframe => {
            // Small delay to ensure iframe is properly rendered
            setTimeout(() => {
                setupCurtainForIframe(iframe);
            }, 100);
        });
    }

    function initialize() {
        // Wait for Reveal.js to be ready
        if (typeof Reveal !== 'undefined') {
            // Handle initial slide
            handleSlideChange();
            
            // Listen for slide changes
            Reveal.on('slidechanged', handleSlideChange);
            Reveal.on('ready', handleSlideChange);
            
            // Also listen for window resize
            window.addEventListener('resize', () => {
                setTimeout(handleSlideChange, 100);
            });
        } else {
            // If Reveal.js not ready, wait a bit and try again
            setTimeout(initialize, 100);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();