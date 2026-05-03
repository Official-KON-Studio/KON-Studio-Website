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
        const monthKey = String(newsItem.date.month || '').toUpperCase();
        const monthFull = monthNames[monthKey] || newsItem.date.month;
        const newsYear = newsItem.year || '2026';
        dateElement.textContent = `${monthFull} ${newsItem.date.day}, ${newsYear}`;
    }

    const summaryElement = document.querySelector('.featured-summary');
    if (summaryElement && newsItem.content && newsItem.content.length > 0) {
        summaryElement.textContent = newsItem.content[0];
    }

    const highlightsTitleElement = document.querySelector('.featured-highlights-title');
    if (highlightsTitleElement && newsItem.features && newsItem.features.title) {
        highlightsTitleElement.textContent = newsItem.features.title;
    }

    const highlightsListElement = document.querySelector('.featured-highlights-list');
    if (highlightsListElement) {
        highlightsListElement.innerHTML = '';

        if (newsItem.features && Array.isArray(newsItem.features.items)) {
            newsItem.features.items.slice(0, 3).forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature.replace(/<[^>]*>/g, '');
                highlightsListElement.appendChild(li);
            });
        }
    }

    const footerElement = document.querySelector('.featured-footer');
    if (footerElement && newsItem.footer) {
        footerElement.textContent = newsItem.footer;
    }

    const imageElement = document.querySelector('.featured-image img');
    if (imageElement) {
        if (newsItem.featuredImage) {
            imageElement.src = newsItem.featuredImage;
        }
        imageElement.alt = newsItem.title;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only load if we're on a page with featured news section
    if (document.querySelector('#featured-news')) {
        loadFeaturedNews();
    }
});
