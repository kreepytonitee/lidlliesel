// Function to load affiliate data and display a random ad in the banner
async function loadAffiliateBanner() {
    try {
        const response = await fetch('../data/affiliates.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const affiliates = await response.json();

        if (affiliates.length > 0) {
            const randomIndex = Math.floor(Math.random() * affiliates.length);
            const ad = affiliates[randomIndex];

            const topBanner = document.getElementById('topBanner');
            if (topBanner) {
                topBanner.innerHTML = `
                    <div class="ad-content">
                        ${ad.image_url ? `<img src="${ad.image_url}" alt="${ad.name}">` : ''}
                        <span>Check out our partner: <strong>${ad.name}</strong></span>
                    </div>
                    <a href="${ad.url}" target="_blank" rel="noopener noreferrer">Visit Now!</a>
                `;
            }
        }
    } catch (error) {
        console.error("Error loading affiliate banner:", error);
        const topBanner = document.getElementById('topBanner');
        if (topBanner) {
            topBanner.innerHTML = '<p>Advertisement loading failed. Please try again later.</p>';
        }
    }
}

// Function to handle the affiliate wall interaction
async function handleAffiliateWall() {
    const affiliateWall = document.getElementById('affiliateWall');
    const chapterContent = document.getElementById('chapterContent');
    const unlockButton = document.getElementById('unlockChapterBtn');

    if (!affiliateWall || !chapterContent || !unlockButton) {
        console.warn("Affiliate wall elements not found. Chapter might be directly visible.");
        chapterContent.classList.remove('hidden'); // Ensure content is visible if wall isn't set up
        return;
    }

    // Check if the chapter has been unlocked in the current session
    const chapterUnlocked = sessionStorage.getItem('chapterUnlocked');

    if (chapterUnlocked === 'true') {
        affiliateWall.classList.add('hidden');
        chapterContent.classList.remove('hidden');
        return;
    }

    // If not unlocked, display the wall and set up the button click listener
    affiliateWall.classList.remove('hidden');
    chapterContent.classList.add('hidden');

    unlockButton.addEventListener('click', async () => {
        try {
            const response = await fetch('../data/affiliates.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const affiliates = await response.json();

            if (affiliates.length > 0) {
                const randomIndex = Math.floor(Math.random() * affiliates.length);
                const ad = affiliates[randomIndex];

                // Open affiliate link in a new tab
                window.open(ad.url, '_blank');

                // Unlock content on the current page
                affiliateWall.classList.add('hidden');
                chapterContent.classList.remove('hidden');
                sessionStorage.setItem('chapterUnlocked', 'true'); // Mark as unlocked for this session

            } else {
                console.warn("No affiliate links found. Unlocking chapter directly.");
                affiliateWall.classList.add('hidden');
                chapterContent.classList.remove('hidden');
                sessionStorage.setItem('chapterUnlocked', 'true');
            }
        } catch (error) {
            console.error("Error unlocking chapter via affiliate wall:", error);
            // Fallback: unlock chapter even if there's an error fetching links
            affiliateWall.classList.add('hidden');
            chapterContent.classList.remove('hidden');
            sessionStorage.setItem('chapterUnlocked', 'true');
        }
    });
}

// Function to load and display stories on the home page
async function loadStories() {
    const storiesListDiv = document.getElementById('storiesList');
    const loadingMessage = document.getElementById('loadingStories');

    if (!storiesListDiv) {
        console.error("Stories list container not found.");
        return;
    }

    try {
        const response = await fetch('data/stories.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stories = await response.json();

        if (loadingMessage) {
            loadingMessage.remove(); // Remove loading message once data is fetched
        }

        if (stories.length === 0) {
            storiesListDiv.innerHTML = '<p>No stories available yet. Please check back later!</p>';
            return;
        }

        stories.forEach(story => {
            const storyCard = document.createElement('a');
            storyCard.href = `story/${story.slug}/${story.chapters[0].slug}.html`; // Link to the first chapter
            storyCard.classList.add('story-card');

            storyCard.innerHTML = `
                ${story.cover_image_url ? `<img src="${story.cover_image_url}" alt="${story.title} Cover">` : ''}
                <div class="story-card-content">
                    <h3>${story.title}</h3>
                    <p>${story.description}</p>
                    <span class="read-link">Read Story</span>
                </div>
            `;
            storiesListDiv.appendChild(storyCard);
        });

    } catch (error) {
        console.error("Error loading stories:", error);
        if (loadingMessage) {
            loadingMessage.textContent = 'Failed to load stories. Please try again later.';
        } else {
            storiesListDiv.innerHTML = '<p>Failed to load stories. Please try again later.</p>';
        }
    }
}

// Function to initialize chapter page (title, navigation, affiliate wall)
async function initializeChapterPage(currentStorySlug, currentChapterSlug) {
    try {
        const response = await fetch('../../data/stories.json'); // Adjust path for chapter pages
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stories = await response.json();

        const currentStory = stories.find(s => s.slug === currentStorySlug);

        if (!currentStory) {
            console.error("Current story not found:", currentStorySlug);
            document.getElementById('chapterTitle').textContent = "Story Not Found";
            return;
        }

        document.getElementById('storyTitle').textContent = `From: ${currentStory.title}`;

        const chapterIndex = currentStory.chapters.findIndex(c => c.slug === currentChapterSlug);

        if (chapterIndex === -1) {
            console.error("Current chapter not found:", currentChapterSlug);
            document.getElementById('chapterTitle').textContent = "Chapter Not Found";
            return;
        }

        const currentChapter = currentStory.chapters[chapterIndex];
        document.getElementById('chapterTitle').textContent = currentChapter.title;

        // Set up navigation links
        const prevChapterButton = document.getElementById('prevChapter');
        const nextChapterButton = document.getElementById('nextChapter');

        if (chapterIndex > 0) {
            const prevChapter = currentStory.chapters[chapterIndex - 1];
            prevChapterButton.href = `../${currentStorySlug}/${prevChapter.slug}.html`;
            prevChapterButton.classList.remove('hidden');
        }

        if (chapterIndex < currentStory.chapters.length - 1) {
            const nextChapter = currentStory.chapters[chapterIndex + 1];
            nextChapterButton.href = `../${currentStorySlug}/${nextChapter.slug}.html`;
            nextChapterButton.classList.remove('hidden');
        }

        // Initialize the affiliate wall
        handleAffiliateWall();

    } catch (error) {
        console.error("Error initializing chapter page:", error);
        document.getElementById('chapterTitle').textContent = "Error Loading Chapter";
    }
}

// Ensure affiliate banner loads on all pages
// This function is called from the <script> blocks in both index.html and chapter-X.html
// document.addEventListener('DOMContentLoaded', loadAffiliateBanner); // Called separately now