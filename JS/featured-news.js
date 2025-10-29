// Load and display featured news on homepage
async function loadFeaturedNews() {
    try {
        const response = await fetch('../DATA/news-data.json');
        const data = await response.json();
        
        // Get the first (latest) news item
        if (data.news && data.news.length > 0) {
            const latestNews = data.news[0];
            displayFeaturedNews(latestNews);
        }
    } catch (error) {
        console.error('Error loading featured news:', error);
        // Keep the default content if loading fails
    }
}

// Display the featured news
function displayFeaturedNews(newsItem) {
    // Update tag
    const tagElement = document.querySelector('.featured-tag');
    if (tagElement) {
        tagElement.textContent = newsItem.tag;
    }

    // Update title
    const titleElement = document.querySelector('.featured-info h3');
    if (titleElement) {
        titleElement.textContent = newsItem.title;
    }

    // Update date
    const dateElement = document.querySelector('.featured-date');
    if (dateElement) {
        const monthNames = {
            'JAN': 'January', 'FEB': 'February', 'MAR': 'March',
            'APR': 'April', 'MAY': 'May', 'JUN': 'June',
            'JUL': 'July', 'AUG': 'August', 'SEP': 'September',
            'OCT': 'October', 'NOV': 'November', 'DEC': 'December'
        };
        const monthFull = monthNames[newsItem.date.month] || newsItem.date.month;
        dateElement.textContent = `${monthFull} ${newsItem.date.day}, 2025`;
    }

    // Update content - combine all paragraphs
    const contentElement = document.querySelector('.featured-info p:not(.featured-date)');
    if (contentElement) {
        let contentHTML = '';
        
        // Add main content paragraphs
        newsItem.content.forEach((paragraph, index) => {
            contentHTML += paragraph;
            if (index < newsItem.content.length - 1) {
                contentHTML += '<br>';
            }
        });
        
        // Add features if they exist
        if (newsItem.features && newsItem.features.items) {
            contentHTML += '<br>';
            newsItem.features.items.slice(0, 3).forEach(feature => {
                contentHTML += feature.replace(/<strong>|<\/strong>/g, '') + ' ';
            });
        }
        
        contentElement.innerHTML = contentHTML;
    }

    // Update image if provided in JSON (optional enhancement)
    if (newsItem.featuredImage) {
        const imageElement = document.querySelector('.featured-image img');
        if (imageElement) {
            imageElement.src = newsItem.featuredImage;
            imageElement.alt = newsItem.title;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only load if we're on a page with featured news section
    if (document.querySelector('#featured-news')) {
        loadFeaturedNews();
    }
});