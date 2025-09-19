// Get query string
const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});
let channel_title = 'activity-efz52cmnw4o';

// Are.na's base API url
const api = 'https://api.are.na/v2/channels/';

// Get grid element from index.html
const thumbs_el = document.querySelector('#thumbs');

// Removed loading indicator

let allImages = [];
let uniqueUrls = new Set();

// Function to fetch a page of contents
async function fetchPage(page = 1, per = 100) {
    try {
        const response = await fetch(`${api}${channel_title}/contents?page=${page}&per=${per}&direction=desc`, {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching page:', error);
        return null;
    }
}

// Add these new functions and variables
const PADDING = 50; // Minimum distance from edges
const MAX_CONCURRENT = 12; // cap number of concurrent images on screen
const SPAWN_INTERVAL_MS = 1800; // how often to add a new image
const INITIAL_SPAWNS = 6; // how many to add right away

function getRandomPosition() {
    const maxWidth = window.innerWidth - (PADDING * 2) - 400;
    const maxHeight = window.innerHeight - (PADDING * 2) - 400;
    return {
        x: PADDING + Math.random() * maxWidth,
        y: PADDING + Math.random() * maxHeight
    };
}

// Add shuffle function to randomize image order
function shuffleArray(array) {
    let currentIndex = array.length;
    while (currentIndex > 0) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = 
        [array[randomIndex], array[currentIndex]];
    }
    return array;
}

let imageQueue = []; // Will hold our shuffled images

function showFloatingImage() {
    if (allImages.length === 0) return;

    // Respect cap on concurrent images
    const current = document.querySelectorAll('img.floating-image').length;
    if (current >= MAX_CONCURRENT) {
        setTimeout(showFloatingImage, SPAWN_INTERVAL_MS);
        return;
    }

    // If queue is empty, reshuffle all images
    if (imageQueue.length === 0) {
        imageQueue = [...allImages];
        shuffleArray(imageQueue);
        console.log('Reshuffled image queue');
    }

    // Take the next image from the queue
    const nextImage = imageQueue.pop();
    const imageUrl = nextImage.image.display.url;
    const imageTitle = nextImage.title || 'Untitled';
    
    // Create link element
    const linkElement = document.createElement('a');
    linkElement.href = `https://www.are.na/block/${nextImage.id}`;
    linkElement.target = '_blank';
    linkElement.style.position = 'absolute';
    
    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.classList.add('floating-image');
    
    // Positioning is handled by the floating animation script via transforms
    
    // Append image to link, then link to body
    linkElement.appendChild(imgElement);
    document.body.appendChild(linkElement);

    // Queue next image
    setTimeout(showFloatingImage, SPAWN_INTERVAL_MS);
}

// Main function to fetch all contents
async function fetchAllContents() {
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
        const data = await fetchPage(page, 20);
        if (!data) break;
        
        data.contents.forEach(block => {
            if (block.class == 'Image' && !uniqueUrls.has(block.image.display.url)) {
                uniqueUrls.add(block.image.display.url);
                allImages.push(block);
            }
        });
        
        hasMore = data.contents.length === 20;
        page++;
    }
    
    console.log(`Loaded ${allImages.length} unique images`);
    
    // Spawn a bunch immediately, then continue at interval
    for (let i = 0; i < INITIAL_SPAWNS; i++) {
        setTimeout(showFloatingImage, i * 120);
    }
}

// Start fetching contents
fetchAllContents();
