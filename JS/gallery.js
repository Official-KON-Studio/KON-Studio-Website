// Load and display gallery from JSON
let allGalleryItems = [];

// Load gallery data
async function loadGallery() {
    try {
        const response = await fetch('../DATA/gallery-data.json');
        const data = await response.json();
        
        // Display official artwork
        displayGallery(data.officialArt, '#official-gallery .gallery-grid');
        
        // Display fan art
        displayGallery(data.fanArt, '#fanart-gallery .gallery-grid', true);
        
        // Store all items for filtering
        allGalleryItems = [...data.officialArt, ...data.fanArt];
        
        // Setup filtering and download buttons
        setupFiltering();
        setupDownloadButtons();
    } catch (error) {
        console.error('Error loading gallery:', error);
        document.querySelector('#official-gallery .gallery-grid').innerHTML = 
            '<p style="text-align: center; color: var(--text-secondary);">Failed to load gallery. Please try again later.</p>';
    }
}

// Display gallery items
function displayGallery(items, containerSelector, isFanArt = false) {
    const container = document.querySelector(containerSelector);
    container.innerHTML = '';

    items.forEach(item => {
        const galleryElement = createGalleryElement(item, isFanArt);
        container.appendChild(galleryElement);
    });
}

// Create a gallery item element
function createGalleryElement(item, isFanArt = false) {
    const galleryItem = document.createElement('div');
    galleryItem.className = isFanArt ? 'gallery-item fanart-item' : 'gallery-item';
    galleryItem.setAttribute('data-category', item.category);

    // Create image container
    const imageDiv = document.createElement('div');
    imageDiv.className = 'gallery-image';
    
    if (item.isEmoji) {
        // For emoji placeholders
        imageDiv.textContent = item.image;
    } else {
        // For actual images
        const img = document.createElement('img');
        img.className = 'gallery-Art';
        img.src = item.image;
        img.alt = item.title;
        imageDiv.appendChild(img);
    }

    // Create overlay
    const overlayDiv = document.createElement('div');
    overlayDiv.className = 'gallery-overlay';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'gallery-download';
    downloadBtn.textContent = item.downloadable ? 'Download HD' : 'View Full';
    
    overlayDiv.appendChild(downloadBtn);

    // Create info section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'gallery-info';
    
    const title = document.createElement('h3');
    title.textContent = item.title;
    
    const description = document.createElement('p');
    description.textContent = item.description;
    
    infoDiv.appendChild(title);
    infoDiv.appendChild(description);

    // Assemble the gallery item
    galleryItem.appendChild(imageDiv);
    galleryItem.appendChild(overlayDiv);
    galleryItem.appendChild(infoDiv);

    return galleryItem;
}

// Setup filtering
function setupFiltering() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.getAttribute('data-filter');
            
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Filter items
            const galleryItems = document.querySelectorAll('.gallery-item');
            galleryItems.forEach(item => {
                if (filter === 'all') {
                    item.style.display = 'block';
                } else {
                    const category = item.getAttribute('data-category');
                    item.style.display = category === filter ? 'block' : 'none';
                }
            });
        });
    });
}

// Setup download button functionality
function setupDownloadButtons() {
    document.querySelectorAll('.gallery-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            alert('Download feature coming soon! Support us on Patreon for early access to HD artwork.');
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
});