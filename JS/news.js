// Load and display news from JSON
let allNews = [];
let currentFilter = 'all';

// Load news data
async function loadNews() {
    try {
        const response = await fetch('../DATA/news-data.json');
        const data = await response.json();
        allNews = data.news;
        displayNews(allNews);
        setupFiltering();
    } catch (error) {
        console.error('Error loading news:', error);
        document.querySelector('.news-grid').innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Failed to load news. Please try again later.</p>';
    }
}

// Display news items
function displayNews(newsItems) {
    const newsGrid = document.querySelector('.news-grid');
    newsGrid.innerHTML = '';

    if (!newsItems || newsItems.length === 0) {
        newsGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No news posts available yet.</p>';
        return;
    }

    newsItems.forEach(item => {
        const newsElement = createNewsElement(item);
        newsGrid.appendChild(newsElement);
    });
}

// Parses "2025-10-01" as a local date (avoids timezone off-by-one),
// and falls back to the browser's parser for strings like "October 1, 2025"
function parseDate(str) {
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    return new Date(str);
}

// Create a news item element
function createNewsElement(item) {
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item';
    newsItem.setAttribute('data-category', item.category);

    // Create date section
const dateDiv = document.createElement('div');
dateDiv.className = 'news-date';

const d = parseDate(item.date);

if (isNaN(d)) {
    // Fallback: show the raw string if it can't be parsed
    dateDiv.textContent = item.date;
} else {
    const month = document.createElement('span');
    month.className = 'news-month';
    month.textContent = d.toLocaleString('en', { month: 'short' }); // "Oct" (CSS uppercases it)

    const day = document.createElement('span');
    day.className = 'news-day';
    day.textContent = String(d.getDate()).padStart(2, '0');

    const year = document.createElement('span');
    year.className = 'news-year';
    year.textContent = d.getFullYear();

    dateDiv.append(month, day, year);
}

    // Create content section
    const contentDiv = document.createElement('div');
    contentDiv.className = 'news-content';

    // Title
    const title = document.createElement('h3');
    title.textContent = item.title;

    // Tag
    const tag = document.createElement('span');
    tag.className = 'news-tag';
    tag.textContent = item.type;

    // Add to content
    contentDiv.appendChild(title);
    contentDiv.appendChild(tag);

    // Summary
    const summary = document.createElement('p');
    summary.textContent = item.summary;
    contentDiv.appendChild(summary);

    // Features list (if exists)
    if (item.highlights && item.highlights.length > 0) {
        const ul = document.createElement('ul');
        item.highlights.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            ul.appendChild(li);
        });
        contentDiv.appendChild(ul);
    }

    // Footer (if exists)
    if (item.status) {
        const footer = document.createElement('p');
        footer.textContent = item.status;
        contentDiv.appendChild(footer);
    }

    // Assemble the news item
    newsItem.appendChild(dateDiv);
    newsItem.appendChild(contentDiv);

    return newsItem;
}

// Setup filtering after news is loaded
function setupFiltering() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.getAttribute('data-filter');
            
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Filter items
            const newsItems = document.querySelectorAll('.news-item');
            newsItems.forEach(item => {
                if (filter === 'all') {
                    item.style.display = 'grid';
                } else {
                    const category = item.getAttribute('data-category');
                    item.style.display = category === filter ? 'grid' : 'none';
                }
            });
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load news
    loadNews();

    // Newsletter Form (if exists on page)
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thanks for subscribing! Check your email to confirm your subscription.');
            e.target.reset();
        });
    }
});
