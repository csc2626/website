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
        curtain.style.backgroundColor = 'rgba(0, 0, 0, 1)';
        curtain.style.zIndex = '10';
        curtain.style.pointerEvents = 'none'; // allows clicks to pass through
        curtain.style.opacity = '0';
        return curtain;
    }


    function isYouTubeVideo(iframe) {
        return iframe.src && iframe.src.includes('youtube.com');
    }

    function setupYouTubePlayer(iframe, curtain) {
        if (!isYouTubeAPIReady || !isYouTubeVideo(iframe)) {
            return;
        }

        //const iframeId = iframe.id || iframe.src || Math.random().toString(36);
        const iframeId = iframe.id;

        // Make sure iframe has an ID for YouTube API
        if (!iframe.id) {
            iframe.id = 'youtube-player-' + Math.random().toString(36).substr(2, 9);
        }

        try {
            const player = new YT.Player(iframe.id, {
                events: {
                    'onStateChange': function(event) {
                        // console.log("STATE of youtube : ", event.data); 

                        if(event.data == 0){
                            curtain.style.opacity = '1';
                        } else {
                            curtain.style.opacity = '0';
                        }
                        
                    }
                }
            });
            
            youtubePlayer.set(iframeId, player);
        } catch (error) {
            console.log('Error creating YouTube player:', error);
        }
    }

    function updateCurtain(iframe, curtain) {
        // console.log("is udateCurtain called for iframe:", iframe.id);
        if (!iframe || !curtain) return;

        let positionedParent = iframe.offsetParent;

        if (!positionedParent || positionedParent === document.body) {
            // If no positioned parent, make the immediate parent positioned
            const parent = iframe.parentNode;
            positionedParent = parent;
        }

        // Get iframe's position relative to its positioned parent
        const iframeRect = iframe.getBoundingClientRect();
        const parentRect = positionedParent.getBoundingClientRect();
        // console.log('Getting height and width Iframe rect:', iframeRect, iframe.width);
        
        // Calculate curtain dimensions (70% height, same width)
        const curtainWidth = iframe.offsetWidth;
        const curtainHeight = iframe.offsetHeight * 0.7;
        
        // Calculate exact position relative to the positioned parent
        curtainLeft = 0;
        // const curtainTop = (iframeRect.top - parentRect.top) + (iframe.offsetHeight * 0.2);
        const curtainTop = (iframeRect.top - parentRect.top) + (iframe.offsetHeight * 0.15);
        
        // Apply styles
        curtain.style.width = curtainWidth + 'px';
        curtain.style.height = curtainHeight + 'px';
        curtain.style.top = curtainTop + 'px';
        curtain.style.left = curtainLeft + 'px';
    }

    function setupCurtainForIframe(iframe) {
        const iframeId = iframe.id;
        
        // Skip if already has curtain
        if (curtains.has(iframeId)) {
            return;
        }
        
        // Find the closest positioned parent or create one
        let positionedParent = iframe.offsetParent;
        //let positionedParent = iframe.parentNode; // this changed 
        const parent = iframe.parentNode;
            if (getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }
        
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
        //positionedParent.appendChild(curtain);
        iframe.parentNode.appendChild(curtain); //fixed this to append 
        curtains.set(iframeId, curtain);
        
        // Initial update
        updateCurtain(iframe, curtain);
        
        // Setup YouTube player if it's a YouTube video
        if (isYouTubeVideo(iframe)) {
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

    // Handle slide change
    function handleSlideChange() {        
        // Find current slide (section with class 'present')
        const currentSlide = document.querySelector('section.present');
        if (!currentSlide) return;
        
        // Find all iframes in current slide
        const iframes = currentSlide.querySelectorAll('iframe');

        if(iframes.length === 0) {
            return;
        }
        
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

        // assign IDs to all iframes
        const allIframes = document.querySelectorAll('iframe');
        allIframes.forEach((iframe, index) => {
            // Only assign ID if iframe doesn't already have one
            if (!iframe.id) {
                iframe.id = `iframe-${index + 1}`;
            }
        });
        
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