// Smart Flows Portfolio - Main Page JavaScript
// Supports both local videos, YouTube embeds, and localStorage videos

const STORAGE_KEY = 'smartflows_videos';
const HIDDEN_KEY = 'smartflows_hidden';
let videos = [];
let currentFilter = 'all';

// DOM Elements
const portfolioGrid = document.getElementById('portfolio-grid');
const emptyState = document.getElementById('empty-state');
const videoModal = document.getElementById('video-modal');
const modalVideo = document.getElementById('modal-video');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalClose = document.querySelector('.modal-close');
const modalOverlay = document.querySelector('.modal-overlay');
const filterBtns = document.querySelectorAll('.filter-btn');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const contactForm = document.getElementById('contact-form');
const toast = document.getElementById('toast');

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadVideos();
    renderVideos();
    setupEventListeners();
});

// Load videos from JSON file and localStorage
async function loadVideos() {
    try {
        // Get videos from localStorage (added via admin panel)
        let storedVideos = [];
        try {
            storedVideos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch { }

        // Get hidden videos list
        let hiddenVideos = [];
        try {
            hiddenVideos = JSON.parse(localStorage.getItem(HIDDEN_KEY)) || [];
        } catch { }

        // Get videos from videos.json
        let jsonVideos = [];
        try {
            const response = await fetch('videos.json');
            if (response.ok) {
                jsonVideos = await response.json();
            }
        } catch { }

        // Filter out hidden videos from json
        const visibleJsonVideos = jsonVideos.filter(v => !hiddenVideos.includes(v.id));

        // Merge: localStorage videos first, then JSON videos
        videos = [...storedVideos, ...visibleJsonVideos];

    } catch (error) {
        console.log('Error loading videos:', error);
        videos = [];
    }
}

// Setup event listeners
function setupEventListeners() {
    // Modal events
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Filter events
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderVideos();
        });
    });

    // Navigation toggle
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close nav on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // Contact form
    contactForm.addEventListener('submit', handleContactSubmit);

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Render videos
function renderVideos() {
    const filteredVideos = currentFilter === 'all'
        ? videos
        : videos.filter(v => v.category === currentFilter);

    const cards = portfolioGrid.querySelectorAll('.video-card');
    cards.forEach(card => card.remove());

    if (filteredVideos.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';

        filteredVideos.forEach(video => {
            const card = createVideoCard(video);
            portfolioGrid.insertBefore(card, emptyState);
        });
    }
}

// Create video card
function createVideoCard(video) {
    const categoryLabels = {
        commercial: 'إعلانات',
        motion: 'موشن جرافيك',
        social: 'سوشيال ميديا'
    };

    const isYouTube = video.youtubeId && video.youtubeId.length > 0;
    const thumbnailSrc = isYouTube
        ? `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`
        : '';

    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.category = video.category;

    if (isYouTube) {
        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbnailSrc}" alt="${video.title}" style="width:100%;height:100%;object-fit:cover;">
                <div class="video-play-btn">
                    <div class="play-icon">
                        <svg viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="video-info">
                <span class="video-category">${categoryLabels[video.category] || video.category}</span>
                <h3 class="video-title">${video.title}</h3>
                <p class="video-desc">${video.description || 'لا يوجد وصف'}</p>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="video-thumbnail">
                <video src="${video.videoFile}" muted preload="metadata"></video>
                <div class="video-play-btn">
                    <div class="play-icon">
                        <svg viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="video-info">
                <span class="video-category">${categoryLabels[video.category] || video.category}</span>
                <h3 class="video-title">${video.title}</h3>
                <p class="video-desc">${video.description || 'لا يوجد وصف'}</p>
            </div>
        `;
    }

    const thumbnail = card.querySelector('.video-thumbnail');
    thumbnail.addEventListener('click', () => openModal(video));

    // Video preview on hover (only for local videos)
    if (!isYouTube) {
        const videoEl = card.querySelector('.video-thumbnail video');
        if (videoEl) {
            card.addEventListener('mouseenter', () => {
                videoEl.currentTime = 0;
                videoEl.play().catch(() => { });
            });
            card.addEventListener('mouseleave', () => {
                videoEl.pause();
                videoEl.currentTime = 0;
            });
        }
    }

    return card;
}

// Open modal
function openModal(video) {
    const isYouTube = video.youtubeId && video.youtubeId.length > 0;
    const modalVideoContainer = document.querySelector('.modal-video-container');

    if (isYouTube) {
        modalVideoContainer.innerHTML = `
            <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/${video.youtubeId}?autoplay=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                style="aspect-ratio: 16/9;">
            </iframe>
        `;
    } else {
        modalVideoContainer.innerHTML = `<video id="modal-video" controls src="${video.videoFile}" style="width:100%;aspect-ratio:16/9;background:black;"></video>`;
        setTimeout(() => {
            document.getElementById('modal-video').play().catch(() => { });
        }, 100);
    }

    modalTitle.textContent = video.title;
    modalDescription.textContent = video.description || '';
    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    videoModal.classList.remove('active');
    const modalVideoContainer = document.querySelector('.modal-video-container');
    modalVideoContainer.innerHTML = '<video id="modal-video" controls></video>';
    document.body.style.overflow = '';
}

// Handle contact form submit
function handleContactSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;

    // Open WhatsApp with the message
    const whatsappMessage = `مرحباً، أنا ${name}%0A%0Aالموضوع: ${subject}%0A%0A${message}%0A%0Aالبريد: ${email}`;
    window.open(`https://wa.me/201003782943?text=${whatsappMessage}`, '_blank');

    showToast('سيتم فتح WhatsApp لإرسال رسالتك');
    contactForm.reset();
}

// Show toast notification
function showToast(message) {
    const toastMessage = toast.querySelector('.toast-message');
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.background = 'rgba(10, 10, 15, 0.95)';
    } else {
        navbar.style.background = 'rgba(10, 10, 15, 0.8)';
    }
});
