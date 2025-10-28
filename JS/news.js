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

    newsItems.forEach(item => {
        const newsElement = createNewsElement(item);
        newsGrid.appendChild(newsElement);
    });
}

// Create a news item element
function createNewsElement(item) {
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item';
    newsItem.setAttribute('data-category', item.category);

    // Create date section
    const dateDiv = document.createElement('div');
    dateDiv.className = 'news-date';
    dateDiv.innerHTML = `
        <span class="news-day">${item.date.day}</span>
        <span class="news-month">${item.date.month}</span>
    `;

    // Create content section
    const contentDiv = document.createElement('div');
    contentDiv.className = 'news-content';

    // Title
    const title = document.createElement('h3');
    title.textContent = item.title;

    // Tag
    const tag = document.createElement('span');
    tag.className = 'news-tag';
    tag.textContent = item.tag;

    // Add to content
    contentDiv.appendChild(title);
    contentDiv.appendChild(tag);

    // Content paragraphs
    item.content.forEach(paragraph => {
        const p = document.createElement('p');
        p.innerHTML = paragraph;
        contentDiv.appendChild(p);
    });

    // Features list (if exists)
    if (item.features) {
        if (item.features.title) {
            const featuresTitle = document.createElement('p');
            featuresTitle.innerHTML = `<strong>${item.features.title}</strong>`;
            contentDiv.appendChild(featuresTitle);
        }

        const ul = document.createElement('ul');
        item.features.items.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = feature;
            ul.appendChild(li);
        });
        contentDiv.appendChild(ul);
    }

    // Footer (if exists)
    if (item.footer) {
        const footer = document.createElement('p');
        footer.innerHTML = item.footer;
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