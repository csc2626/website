// Auto-create curtains for iframes on current slide in Quarto reveal.js
// with YouTube API integration for video end detection
(function() {
    let curtains = new Map(); // Track created curtains
    let resizeObservers = new Map(); // Track resize observers
    let mutationObservers = new Map(); // Track mutation observers
    let youtubePlayer = new Map(); // Track YouTube players
    let isYouTubeAPIReady = false;

    // Load YouTube API
    function loadYouTubeAPI() {
        if (window.YT) {
            isYouTubeAPIReady = true;
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
        
        window.onYouTubeIframeAPIReady = function() {
            isYouTubeAPIReady = true;
            console.log('YouTube API loaded');
        };
    }

    function createCurtain(iframe) {
        // Create curtain div
        const curtain = document.createElement('div');
        curtain.className = 'curtain';
        curtain.style.position = 'absolute';
        curtain.style.backgroundColor = 'rgba(100, 0, 0, 0.7)';
        curtain.style.zIndex = '10';
        curtain.style.pointerEvents = 'none'; // Optional: allows clicks to pass through
        curtain.style.visibility = 'hidden'; // Hidden by default
        
        return curtain;
    }

    function showCurtain(curtain) {
        if (curtain) {
            curtain.style.visibility = 'visible';
            curtain.style.opacity = '1';
        }
    }

    function hideCurtain(curtain) {
        if (curtain) {
            curtain.style.opacity = '0';
            curtain.style.visibility = 'hidden';
            // setTimeout(() => {
            //     curtain.style.visibility = 'hidden';
            // }, 300); // Wait for transition to complete
        }
    }

    function isYouTubeVideo(iframe) {
        return iframe.src && iframe.src.includes('youtube.com');
    }

    function setupYouTubePlayer(iframe, curtain) {
        if (!isYouTubeAPIReady || !isYouTubeVideo(iframe)) {
            return;
        }

        const iframeId = iframe.id;
        
        try {
            const player = new YT.Player(iframeId, {
                events: {
                    'onStateChange': function(event) {
                        if(event.data == 0){
                            console.log('Video ended, showing curtain');
                            showCurtain(curtain);
                        } else {
                            hideCurtain(curtain);
                        }
                        // switch(event.data) {
                        //     case YT.PlayerState.ENDED:
                        //         console.log('Video ended, showing curtain');
                        //         showCurtain(curtain);
                        //         break;
                        //     case YT.PlayerState.PLAYING:
                        //         console.log('Video playing, hiding curtain');
                        //         hideCurtain(curtain);
                        //         break;
                        //     case YT.PlayerState.BUFFERING:
                        //         // Hide curtain when video starts buffering (play again)
                        //         hideCurtain(curtain);
                        //         break;
                        // }
                    }
                }
            });
            
            youtubePlayer.set(iframeId, player);
        } catch (error) {
            console.log('Error creating YouTube player:', error);
        }
    }

    function updateCurtain(iframe, curtain) {
        if (!iframe || !curtain) return;
        
        // Get iframe's position relative to its positioned parent
        const iframeRect = iframe.getBoundingClientRect();
        const parentRect = iframe.offsetParent.getBoundingClientRect();
        
        // Calculate curtain dimensions (60% height, same width)
        const curtainWidth = iframe.offsetWidth;
        const curtainHeight = iframe.offsetHeight * 0.6;
        
        // Calculate exact position relative to the positioned parent
        // const curtainLeft = iframeRect.left - parentRect.left;
        const curtainLeft = 0;
        const curtainTop = (iframeRect.top - parentRect.top) + (iframe.offsetHeight * 0.2);
        
        // Apply styles
        curtain.style.width = curtainWidth + 'px';
        curtain.style.height = curtainHeight + 'px';
        curtain.style.top = curtainTop + 'px';
        curtain.style.left = curtainLeft + 'px';
    }

    function assignIncrementalIds() {
        // Get all iframes in the document
        const allIframes = document.querySelectorAll('iframe');
        
        allIframes.forEach((iframe, index) => {
            // Only assign ID if iframe doesn't already have one
            if (!iframe.id) {
                iframe.id = `iframe-${index + 1}`;
            }
        });
    }

    function setupCurtainForIframe(iframe) {
        const iframeId = iframe.id || `iframe-${Math.floor(Math.random() * 1000)}`;
        
        // Skip if already has curtain
        if (curtains.has(iframeId)) {
            return;
        }
        
        // Find the closest positioned parent or create one
        let positionedParent = iframe.offsetParent;
        if (!positionedParent || positionedParent === document.body) {
            // If no positioned parent, make the immediate parent positioned
            const parent = iframe.parentNode;
            if (getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }
            positionedParent = parent;
        }
        
        // Create curtain and append to the positioned parent
        const curtain = createCurtain(iframe);
        positionedParent.appendChild(curtain);
        curtains.set(iframeId, curtain);
        
        // Initial update
        updateCurtain(iframe, curtain);
        
        // Setup YouTube player if it's a YouTube video
        if (isYouTubeVideo(iframe)) {
            // Make sure iframe has an ID for YouTube API
            if (!iframe.id) {
                iframe.id = `youtube-player-${Math.floor(Math.random() * 1000)}`;
            }
            
            // Wait a bit for iframe to load, then setup YouTube player
            setTimeout(() => {
                setupYouTubePlayer(iframe, curtain);
            }, 1000);
        }
        
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
            
            // Clean up YouTube players
            // const player = youtubePlayer.get(iframeId);
            // if (player && typeof player.destroy === 'function') {
            //     try {
            //         player.destroy();
            //     } catch (error) {
            //         console.log('Error destroying YouTube player:', error);
            //     }
            //     youtubePlayer.delete(iframeId);
            // }
        });
        
        curtains.clear();
    }

    function handleSlideChange() {
        // Clean up existing curtains
        // cleanupCurtains();
        
        // Assign incremental IDs to all iframes first
        assignIncrementalIds();
        
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
        // Load YouTube API first
        loadYouTubeAPI();
        
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