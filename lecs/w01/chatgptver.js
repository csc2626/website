// Load YouTube API if not already loaded
if (!window.YT) {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

const ytPlayers = new Map();
let curtains = new Map(); // Track created curtains

// When YouTube API is ready
window.onYouTubeIframeAPIReady = () => {
  initializeForCurrentSlide();
};

function createCurtain(iframe) {
        // Create curtain div
        const curtain = document.createElement('div');
        curtain.className = 'curtain';
        curtain.style.position = 'absolute';
        curtain.style.backgroundColor = 'rgba(100, 0, 0, 0.7)';
        curtain.style.zIndex = '10';
        curtain.style.pointerEvents = 'none'; // allows clicks to pass through
        //curtain.style.visibility = 'hidden'; // Hidden by default   
        // curtain.style.opacity = '0';
        return curtain;
}

// Called on every slide change
function initializeForCurrentSlide() {
    console.log('Initializing for current slide');

  const currentSlide = document.querySelector('section.present');

  const iframes = currentSlide.querySelectorAll('iframe');
  if (iframes.length === 0) {
    return;
  }

  iframes.forEach((iframe, index) => {
    // const parent = iframe.offsetParent;

    let positionedParent = iframe.parentNode;
    // console.log('Positioned parent:', positionedParent, iframe.parentNode);

    if (curtains.has(iframe.id)) {
        // If curtain already exists, skip this iframe
            return;
        }

    if (getComputedStyle(positionedParent).position === 'static') {
             positionedParent.style.position = 'relative';
       }

    // if (!positionedParent || positionedParent === document.body) {
    //     // If no positioned parent, make the immediate parent positioned
    //     const parent = iframe.parentNode;
    //     if (getComputedStyle(parent).position === 'static') {
    //         parent.style.position = 'relative';
    //     }
    //     positionedParent = parent;
    // }
        
    // Create curtain and append to the positioned parent
    const curtain = createCurtain(iframe);
    positionedParent.appendChild(curtain);
    curtains.set(iframe.id, curtain);

    if (!positionedParent) return;

    // Skip if curtain already exists
    // if (positionedParent.querySelector('.curtain')) return;

    // Create curtain

    // Position relative wrapper
    // parent.style.position = 'relative';
    // parent.appendChild(curtain);

    // Wait for iframe to load
    iframe.addEventListener('load', () => {
        console.log("is this ever called?");
      positionCurtainOverIframe(iframe, curtain);
    });
    // positionCurtainOverIframe(iframe, curtain);

    // Init YouTube player if src is a YouTube URL
    const src = iframe.src || '';
    if (src.includes('youtube.com')) {
      const player = new YT.Player(iframe, {
        events: {
          onStateChange: (event) => {
            const state = event.data;
            // Video ended (YT.PlayerState.ENDED === 0)
            if (state === YT.PlayerState.ENDED) {
              curtain.style.visibility = 'visible';
            } else {
              curtain.style.visibility = 'hidden';
            }
          },
        },
      });
      ytPlayers.set(iframe, player);
    }
  });
}

// Compute curtain size and position
function positionCurtainOverIframe(iframe, curtain) {
//   const rect = iframe.getBoundingClientRect();
//   const topOffset = iframe.offsetTop;
//   const leftOffset = iframe.offsetLeft;
//   const width = rect.width;
//   const height = rect.height;

//   curtain.style.top = `${topOffset + height * 0.2}px`; // 20% from top
//   curtain.style.left = `${leftOffset}px`;
//   curtain.style.width = `${width}px`;
//   curtain.style.height = `${height * 0.6}px`; // 60% height
    console.log('Positioning curtain over iframe:', iframe.id);

        // Ensure iframe and curtain exist
    if (!iframe || !curtain) return;

        let positionedParent = iframe.parentNode;
        // if (!positionedParent || positionedParent === document.body) {
        //     // If no positioned parent, make the immediate parent positioned
        //     const parent = iframe.parentNode;
        //     positionedParent = parent;
        // }

        // Get iframe's position relative to its positioned parent
        const iframeRect = iframe.getBoundingClientRect();
        const parentRect = positionedParent.getBoundingClientRect();
        console.log('Getting height and width Iframe rect:', iframeRect. iframe.width);
        
        // Calculate curtain dimensions (60% height, same width)
        // const curtainWidth = iframe.offsetWidth;
        // const curtainHeight = iframe.offsetHeight * 0.6;
        const curtainWidth = iframeRect.width;
        const curtainHeight = iframeRect.height * 0.6;
        
        // Calculate exact position relative to the positioned parent
        //const curtainLeft = iframeRect.left - parentRect.left;
        const curtainLeft = 0;
        const curtainTop = (iframeRect.top - parentRect.top) + (iframe.offsetHeight * 0.2);
        
        // Apply styles
        curtain.style.width = curtainWidth + 'px';
        curtain.style.height = curtainHeight + 'px';
        curtain.style.top = curtainTop + 'px';
        curtain.style.left = curtainLeft + 'px';
}

// Listen for slide changes
Reveal.on('slidechanged', () => {
  initializeForCurrentSlide();
});

const allIframes = document.querySelectorAll('iframe');

// 1. assign IDs to all iframes
allIframes.forEach((iframe, index) => {
    // Only assign ID if iframe doesn't already have one
    if (!iframe.id) {
        iframe.id = `iframe-${index + 1}`;
    }
});