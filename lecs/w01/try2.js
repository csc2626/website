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
                            curtain.style.visibility = 'visible';
                        } else {
                            curtain.style.visibility = 'hidden';
                        }
                    }
                }
            });
            
            // youtubePlayer.set(iframeId, player);
        } catch (error) {
            console.log('Error creating YouTube player:', error);
        }
    }

function setupCurtainForIframe(currentSlide, iframe) {
        console.log('Setting up curtain for iframe:', iframe.id);
        const iframeId = iframe.id;
        const allCurtain = currentSlide.querySelectorAll('.curtain');

        allCurtain.forEach((curtain) => {
            const wrapper = curtain.parentElement; 
            const iframe = wrapper.querySelector('iframe');
            if (!iframe) return;  
            
            const iframeRect = iframe.getBoundingClientRect();
            const parentRect = iframe.offsetParent.getBoundingClientRect();

            
            // Calculate curtain dimensions (80% height, same width)
            const curtainWidth = iframe.offsetWidth;
            const curtainHeight = iframe.offsetHeight * 0.68;
            
            // Center the curtain vertically (10% from top, 10% from bottom)
            // const curtainTop = iframeHeight * 0.16;
            const curtainTop = (iframeRect.top - parentRect.top) + (iframe.offsetHeight * 0.2);


            curtain.style.width = curtainWidth + 'px';
            curtain.style.height = curtainHeight + 'px';
            curtain.style.position = 'absolute';
            curtain.style.top = curtainTop + 'px';
            curtain.style.left = '0px';

            curtain.style.backgroundColor = 'rgba(100, 0, 0, 0.7)';
            curtain.style.zIndex = '10';
            curtain.style.pointerEvents = 'none'; // Optional: allows clicks to pass through
            // curtain.style.visibility = 'hidden'; // Hidden by default
            
            // if (isYouTubeVideo(iframe)) {
            // // Make sure iframe has an ID for YouTube API
            // // if (!iframe.id) {
            // //     iframe.id = `youtube-player-${Math.floor(Math.random() * 1000)}`;
            // // }
            
            // // Wait a bit for iframe to load, then setup YouTube player
            // setTimeout(() => {
            //     setupYouTubePlayer(iframe, curtain);
            // }, 1000);
            // }
        })
}

function init(){
    const allIframes = document.querySelectorAll('iframe');
    console.log('All iframes found:', allIframes.length);
    
    // 1. assign IDs to all iframes
    allIframes.forEach((iframe, index) => {
        // Only assign ID if iframe doesn't already have one
        if (!iframe.id) {
            iframe.id = `iframe-${index + 1}`;
        }
    });

    // 2. Update curtain style for each iframe 

    // Find current slide (section with class 'present')
    const currentSlide = document.querySelector('section.present');
    if (!currentSlide) return;
    console.log('Current slide found:', currentSlide);
    
    // Find all iframes in current slide
    const iframes = currentSlide.querySelectorAll('iframe');
    if(iframes.length === 0) {
        console.log('No iframes found in current slide');
        return;
    }
    
    // Create curtains for each iframe
    iframes.forEach(iframe => {
        // Small delay to ensure iframe is properly rendered
        setTimeout(() => {
            console.log('Setting up curtain for iframe: (be4 func)', iframe.id);
            setupCurtainForIframe(currentSlide, iframe);
        }, 100);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Wait for Reveal.js to be initialized
    if (typeof Reveal !== 'undefined') {
        loadYouTubeAPI();
        init();
    } else {
        // If Reveal.js isn't loaded yet, wait for it
        setTimeout(initReportIssue, 100);
    }
});