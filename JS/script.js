// ==================== THEME MANAGEMENT ====================
const themeSelector = document.getElementById('themeSelector');
const themeDropdown = document.getElementById('themeDropdown');
const themeOptions = document.querySelectorAll('.theme-option');
const body = document.body;

let savedTheme = 'classic';
try {
    savedTheme = localStorage.getItem('konstudio-theme') || 'classic';
} catch (e) {
    console.log('localStorage not available, using default theme');
}

body.setAttribute('data-theme', savedTheme);
updateActiveTheme(savedTheme);

// Toggle theme dropdown
themeSelector.addEventListener('click', (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!themeDropdown.contains(e.target) && e.target !== themeSelector) {
        themeDropdown.classList.remove('active');
    }
});

// Handle theme selection
themeOptions.forEach(option => {
    option.addEventListener('click', () => {
        const theme = option.getAttribute('data-theme');
        body.setAttribute('data-theme', theme);
        
        // FIXED: Try to save theme with error handling
        try {
            localStorage.setItem('konstudio-theme', theme);
        } catch (e) {
            console.log('Could not save theme preference');
        }
        
        updateActiveTheme(theme);
        themeDropdown.classList.remove('active');
    });
});

// Update active theme indicator
function updateActiveTheme(theme) {
    themeOptions.forEach(opt => {
        if (opt.getAttribute('data-theme') === theme) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

// ==================== NAVIGATION FUNCTIONALITY ====================
const menuToggle = document.getElementById('menuToggle');
const sidePanel = document.getElementById('sidePanel');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle side panel
menuToggle.addEventListener('click', () => {
    sidePanel.classList.toggle('open');
    overlay.classList.toggle('active');
    menuToggle.classList.toggle('panel-open');
});

// Close panel when clicking overlay
overlay.addEventListener('click', () => {
    sidePanel.classList.remove('open');
    overlay.classList.remove('active');
    menuToggle.classList.remove('panel-open');
});

// Close panel when clicking nav link (only for same-page links)
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Always close the panel when clicking any link
        sidePanel.classList.remove('open');
        overlay.classList.remove('active');
        menuToggle.classList.remove('panel-open');
        
        // Only prevent default and smooth scroll for hash links on the same page
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
        // For other links (different pages), let the default navigation happen
    });
});

// ==================== SMOOTH SCROLLING ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== SCROLL TO TOP BUTTON ====================
const scrollTop = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollTop.classList.add('visible');
    } else {
        scrollTop.classList.remove('visible');
    }
});

scrollTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ==================== ACTIVE NAV LINK ON SCROLL ====================
const sections = document.querySelectorAll('section[id]');

// FIXED: Only run this on pages with sections (index.html)
if (sections.length > 0) {
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            // Check if it's a hash link matching current section
            if (href === `#${current}`) {
                link.classList.add('active');
            }
            // Or if we're on home and it's the home section
            else if (href === 'index.html' && current === 'home') {
                link.classList.add('active');
            }
        });
    });
}

// FIXED: Set active nav based on current page
function setActiveNavByPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        const linkPage = linkHref.split('#')[0] || 'index.html';
        
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Run on page load
setActiveNavByPage();

// ==================== KEYBOARD ACCESSIBILITY ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        themeDropdown.classList.remove('active');
        sidePanel.classList.remove('open');
        overlay.classList.remove('active');
        menuToggle.classList.remove('panel-open');
    }
});

// ==================== TOGGLE RETRO EFFECT ====================
const toggleRetroBtn = document.getElementById('toggleRetro');

if (toggleRetroBtn) {
    let retroEnabled = false;

    // Set initial state
    document.body.classList.add('no-retro');
    toggleRetroBtn.textContent = 'Retro Off';

    toggleRetroBtn.addEventListener('click', () => {
        retroEnabled = !retroEnabled;
        document.body.classList.toggle('no-retro', !retroEnabled);
        // FIXED: Changed text to be more consistent
        toggleRetroBtn.textContent = retroEnabled ? 'Retro On' : 'Retro Off';
    });
}