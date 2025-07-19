// Function to load affiliate data and display a random ad in the banner
async function loadAffiliateBanner() {
    try {
        const response = await fetch('../data/affiliates.json'); // Adjusted path for chapter pages
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
                        ${ad.image_url ? `<img src="${ad.image_url}" alt="${ad.name || 'Partner Ad'}">` : ''}
                        <span>Check out our partner: <strong>${ad.name || 'Our Partner'}</strong></span>
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

    // If elements aren't found, it means this page isn't using the wall, so show content.
    if (!affiliateWall || !chapterContent || !unlockButton) {
        if (chapterContent) chapterContent.classList.remove('hidden');
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
            const response = await fetch('../data/affiliates.json'); // Adjusted path for chapter pages
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

// --- Homepage Search Functionality ---
let allStories = []; // Global variable to store all stories data

async function loadAndDisplayStories() {
    const storiesListDiv = document.getElementById('storiesList');
    const loadingMessage = document.getElementById('loadingStories'); // Should be removed in static generation but good fallback

    if (!storiesListDiv) {
        console.error("Stories list container not found.");
        return;
    }

    try {
        const response = await fetch('data/stories.json'); // Path relative to index.html
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allStories = await response.json(); // Store all stories globally

        if (loadingMessage) {
            loadingMessage.remove(); // Remove loading message once data is fetched
        }

        displayStories(allStories); // Display all stories initially

    } catch (error) {
        console.error("Error loading stories:", error);
        if (loadingMessage) {
            loadingMessage.textContent = 'Failed to load stories. Please try again later.';
        } else {
            storiesListDiv.innerHTML = '<p>Failed to load stories. Please try again later.</p>';
        }
    }
}


function displayStories(storiesToDisplay) {
    const storiesListDiv = document.getElementById('storiesList');
    storiesListDiv.innerHTML = ''; // Clear previous content

    if (storiesToDisplay.length === 0) {
        storiesListDiv.innerHTML = '<p>No stories found matching your search criteria.</p>';
        return;
    }

    storiesToDisplay.forEach(story => {
        const firstChapterLink = story.chapters.length > 0 ? `story/${story.slug}/${story.chapters[0].slug}.html` : '#';

        const storyCard = document.createElement('a');
        storyCard.href = firstChapterLink;
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
}


function filterStories() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    if (!allStories || allStories.length === 0) return;

    const filtered = allStories.filter(story => {
        // Search in story title and description
        const matchesStory = story.title.toLowerCase().includes(searchTerm) ||
                             story.description.toLowerCase().includes(searchTerm);

        // Search in chapter titles
        const matchesChapter = story.chapters.some(chapter =>
            chapter.title.toLowerCase().includes(searchTerm)
        );

        return matchesStory || matchesChapter;
    });

    displayStories(filtered);
}


// --- Chapter Page Specific Logic ---

// Function to initialize chapter page (title, navigation, affiliate wall)
async function initializeChapterPage(currentStorySlug, currentChapterSlug) {
    try {
        const response = await fetch('../../data/stories.json'); // Adjust path for chapter pages relative to story/slug/
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


        // Set up navigation links and dropdown
        setupChapterNavigation(currentStory, chapterIndex);

        // Initialize the affiliate wall
        handleAffiliateWall();

    } catch (error) {
        console.error("Error initializing chapter page:", error);
        document.getElementById('chapterTitle').textContent = "Error Loading Chapter";
    }
}

function setupChapterNavigation(story, currentChapterIndex) {
    const prevChapterButtonTop = document.getElementById('prevChapterTop');
    const nextChapterButtonTop = document.getElementById('nextChapterTop');
    const chapterDropdownTop = document.getElementById('chapterDropdownTop');

    const prevChapterButtonBottom = document.getElementById('prevChapterBottom');
    const nextChapterButtonBottom = document.getElementById('nextChapterBottom');
    const chapterDropdownBottom = document.getElementById('chapterDropdownBottom');


    // Populate dropdowns
    const populateDropdown = (dropdownElement) => {
        dropdownElement.innerHTML = ''; // Clear existing options
        story.chapters.forEach((chapter, index) => {
            const option = document.createElement('option');
            option.value = `./${chapter.slug}.html`; // Link to chapter HTML
            option.textContent = chapter.title;
            if (index === currentChapterIndex) {
                option.selected = true;
            }
            dropdownElement.appendChild(option);
        });

        // Add event listener for dropdown change
        dropdownElement.addEventListener('change', (event) => {
            window.location.href = event.target.value;
        });
    };

    if (chapterDropdownTop) populateDropdown(chapterDropdownTop);
    if (chapterDropdownBottom) populateDropdown(chapterDropdownBottom);


    // Setup Previous/Next Buttons
    const setupNavButtons = (prevBtn, nextBtn) => {
        if (currentChapterIndex > 0) {
            const prevChapter = story.chapters[currentChapterIndex - 1];
            prevBtn.href = `./${prevChapter.slug}.html`;
            prevBtn.classList.remove('hidden');
        } else {
            prevBtn.classList.add('hidden'); // Hide if no previous chapter
        }

        if (currentChapterIndex < story.chapters.length - 1) {
            const nextChapter = story.chapters[currentChapterIndex + 1];
            nextBtn.href = `./${nextChapter.slug}.html`;
            nextBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.add('hidden'); // Hide if no next chapter
        }
    };

    if (prevChapterButtonTop && nextChapterButtonTop) setupNavButtons(prevChapterButtonTop, nextChapterButtonTop);
    if (prevChapterButtonBottom && nextChapterButtonBottom) setupNavButtons(prevChapterButtonBottom, nextChapterButtonBottom);
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Determine if on index.html or a chapter page
    const isChapterPage = window.location.pathname.includes('/story/');

    if (!isChapterPage) {
        // Homepage logic
        loadAndDisplayStories(); // Load and display all stories initially
        loadAffiliateBanner(); // Load banner on index page

        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.addEventListener('keyup', filterStories);
        }
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.addEventListener('click', filterStories);
        }

    } else {
        // Chapter page logic
        const pathSegments = window.location.pathname.split('/');
        const storySlug = pathSegments[pathSegments.length - 2];
        const chapterFileName = pathSegments[pathSegments.length - 1];
        const chapterSlug = chapterFileName.replace('.html', '');

        initializeChapterPage(storySlug, chapterSlug);
        loadAffiliateBanner(); // Load banner on chapter page
    }
});