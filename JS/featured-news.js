// Load and display the latest news item in the homepage table
async function loadFeaturedNews() {
    try {
        const response = await fetch('../DATA/news-data.json');
        const data = await response.json();
        
        if (data.news && data.news.length > 0) {
            displayFeaturedNews(data.news[0]);
        }
    } catch (error) {
        console.error('Error loading featured news:', error);
        const tableBody = document.querySelector('#featured-news-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5">Unable to load the latest update.</td></tr>';
        }
    }
}

// Display one news item as a table row
function displayFeaturedNews(newsItem) {
    const tableBody = document.querySelector('#featured-news-body');
    if (!tableBody) return;

    const highlights = (newsItem.highlights || []).map(highlight => `<li>${highlight}</li>`).join('');
    tableBody.innerHTML = `
        <tr>
            <td data-label="Date / Type" class="featured-meta">
                <time datetime="${newsItem.date}">${newsItem.date}</time>
                <span class="featured-tag">${newsItem.type}</span>
            </td>
            <td data-label="Update / Details" class="featured-content-cell">
                <strong>${newsItem.title}</strong>
                <p>${newsItem.summary}</p>
                <ul class="featured-highlights-list">${highlights}</ul>
                <p class="featured-footer">${newsItem.status}</p>
            </td>
            <td data-label="Artwork" class="featured-artwork-cell">
                <div class="featured-artwork-frame">
                    <img class="featured-image" src="${newsItem.image}" alt="${newsItem.title} artwork">
                </div>
            </td>
        </tr>`;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only load if we're on a page with featured news section
    if (document.querySelector('#featured-news')) {
        loadFeaturedNews();
    }
});
