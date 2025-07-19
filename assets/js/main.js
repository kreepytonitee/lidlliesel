// Function to load affiliate data and display a random ad in the banner
async function loadAffiliateBanner(dataPath) {
    try {
        const response = await fetch(`${dataPath}/affiliates.json`);
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
                    <div class="banner-ad-content">
                        ${ad.image_url ? `<img src="${ad.image_url}" alt="${ad.alt_text || ad.product_name || 'Partner Ad'}">` : ''}
                        <span>Check out our partner: <strong>${ad.product_name || 'Our Partner'}</strong></span>
                    </div>
                    <a href="${ad.link_url}" target="_blank" rel="noopener noreferrer">Visit Now!</a>
                `;
                // Also update alt text and name for better consistency
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
async function handleAffiliateWall(dataPath) {
    const affiliateWall = document.getElementById('affiliateWall');
    const chapterContent = document.getElementById('chapterContent');
    const unlockButton = document.getElementById('unlockChapterBtn');
    const originalButtonText = unlockButton ? unlockButton.textContent : 'Unlock Chapter by Visiting a Partner';

    if (!affiliateWall || !chapterContent || !unlockButton) {
        if (chapterContent) chapterContent.classList.remove('hidden');
        return;
    }

    // --- REMOVE SESSION STORAGE CHECK ---
    // const chapterUnlocked = sessionStorage.getItem('chapterUnlocked');
    // if (chapterUnlocked === 'true') {
    //     affiliateWall.classList.add('hidden');
    //     chapterContent.classList.remove('hidden');
    //     return;
    // }

    // Always display the wall as per new requirement
    affiliateWall.classList.remove('hidden');
    chapterContent.classList.add('hidden');

    unlockButton.onclick = async () => {
        // Disable button immediately to prevent multiple clicks
        unlockButton.disabled = true;

        let ad = null; // Variable to hold the chosen ad

        try {
            // --- Step 1: Fetch affiliates data immediately to get the link ---
            const response = await fetch(`${dataPath}/affiliates.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const affiliates = await response.json();

            if (affiliates.length > 0) {
                const randomIndex = Math.floor(Math.random() * affiliates.length);
                ad = affiliates[randomIndex];

                // --- Step 2: Open the affiliate link immediately upon click ---
                const newTab = window.open(ad.link_url, '_blank', 'noopener,noreferrer');

                // Optional: Check if the pop-up was blocked (though less likely now)
                if (!newTab || newTab.closed || typeof newTab.focus !== 'function') {
                    alert('Pop-up blocked! Please allow pop-ups for this site to unlock the chapter.');
                    unlockButton.disabled = false;
                    unlockButton.textContent = originalButtonText; // Reset button
                    return; // Stop if pop-up was blocked
                }
            } else {
                console.warn("No affiliate links found. Unlocking chapter directly without ad.");
                // If no ads, proceed directly to countdown/unlock
            }

            // --- Step 3: Start countdown in the current tab ---
            let secondsLeft = 5;
            unlockButton.textContent = `Please wait ${secondsLeft}s...`;

            const countdownInterval = setInterval(() => {
                secondsLeft--;
                if (secondsLeft > 0) {
                    unlockButton.textContent = `Please wait ${secondsLeft}s...`;
                } else {
                    clearInterval(countdownInterval); // Stop the countdown
                    unlockButton.textContent = 'Chapter Unlocked!'; // Indicate success

                    // --- Step 4: Unlock story content after countdown ---
                    affiliateWall.classList.add('hidden');
                    chapterContent.classList.remove('hidden');
                    // --- REMOVE SESSION STORAGE SET ---
                    // sessionStorage.setItem('chapterUnlocked', 'true');

                    // Re-enable button and reset text after unlock (in case they navigate away and come back)
                    unlockButton.disabled = false;
                    unlockButton.textContent = originalButtonText;
                }
            }, 1000); // Update every 1 second

        } catch (error) {
            console.error("Error during affiliate wall interaction:", error);
            alert("Could not load affiliate link or unlock chapter. Please try again.");
            // In case of error, unlock anyway, or you can choose to keep it locked.
            // For now, let's just unlock to prevent user frustration.
            affiliateWall.classList.add('hidden');
            chapterContent.classList.remove('hidden');
            // --- REMOVE SESSION STORAGE SET ---
            // sessionStorage.setItem('chapterUnlocked', 'true'); // Unlock even on error
            unlockButton.disabled = false;
            unlockButton.textContent = originalButtonText;
        }
    };
}

// --- Homepage Search Functionality ---
let allStories = []; // Global variable to store all stories data

async function loadAndDisplayStories(dataPath) {
    const storiesListDiv = document.getElementById('storiesList');
    const loadingMessage = document.getElementById('loadingStories');

    if (!storiesListDiv) {
        console.error("Stories list container not found.");
        return;
    }

    try {
        const response = await fetch(`${dataPath}/stories.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allStories = await response.json(); // Store all stories globally

        if (loadingMessage) {
            loadingMessage.remove();
        }

        // Display ALL stories, ordered in reverse (latest first)
        const reversedStories = [...allStories].reverse();
        displayStories(reversedStories);

    } catch (error) {
        console.error("Error loading stories:", error);
        if (loadingMessage) {
            loadingMessage.textContent = 'Failed to load stories. Please try again later.';
        } else {
            storiesListDiv.innerHTML = '<p>Failed to load stories. Please try again later.</p>';
        }
    }
}


// Function to display story cards in a given container
function displayStories(storiesToDisplay, containerId = 'storiesList', isSuggestion = false) {
    const containerDiv = document.getElementById(containerId);
    if (!containerDiv) {
        console.warn(`Container with ID "${containerId}" not found for displaying stories.`);
        return;
    }

    containerDiv.innerHTML = ''; // Clear previous content

    if (storiesToDisplay.length === 0) {
        containerDiv.innerHTML = '<p>No stories found matching your criteria.</p>';
        return;
    }

    storiesToDisplay.forEach(story => {
        // Determine the correct prefix for both the story link and the image URL
        let linkPrefix = '';
        let imageSrcPrefix = '';

        if (isSuggestion) {
            // When displaying suggestions from a chapter page, we need to go up two levels
            linkPrefix = '../../';
            imageSrcPrefix = '../../'; // Also apply this prefix to the image source
        }
        // else (for homepage), prefixes remain empty

        const firstChapterLink = story.chapters.length > 0 ? `${linkPrefix}story/${story.slug}/${story.chapters[0].slug}.html` : '#';
        
        // Construct the full image source URL
        const fullCoverImageUrl = story.cover_image_url ? `${imageSrcPrefix}${story.cover_image_url}` : '';


        const storyCard = document.createElement('a');
        storyCard.href = firstChapterLink;
        storyCard.classList.add('story-card');
        // Add a class for suggestions to apply specific CSS later (if you want different styles)
        if (isSuggestion) {
            storyCard.classList.add('suggestion-card');
        }

        storyCard.innerHTML = `
            ${fullCoverImageUrl ? `<img src="${fullCoverImageUrl}" alt="${story.title} Cover">` : ''}
            <div class="story-card-content">
                <h3>${story.title}</h3>
                <p>${story.description}</p>
                <span class="read-link">Read Story</span>
            </div>
        `;
        containerDiv.appendChild(storyCard);
    });
}


function filterStories() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    if (!allStories || allStories.length === 0) {
        console.warn("Search attempted before stories data was loaded.");
        displayStories([]);
        return;
    }

    const filtered = allStories.filter(story => {
        const matchesStory = story.title.toLowerCase().includes(searchTerm) ||
                             story.description.toLowerCase().includes(searchTerm);

        const matchesChapter = story.chapters.some(chapter =>
            chapter.title.toLowerCase().includes(searchTerm)
        );

        return matchesStory || matchesChapter;
    });

    displayStories(filtered);
}


// --- Chapter Page Specific Logic ---
async function initializeChapterPage(currentStorySlug, currentChapterSlug, dataPath) {
    try {
        const response = await fetch(`${dataPath}/stories.json`);
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

        setupChapterNavigation(currentStory, chapterIndex);
        handleAffiliateWall(dataPath);
        displayRandomStorySuggestions(stories, currentStory.slug); // New function call
    } catch (error) {
        console.error("Error initializing chapter page:", error);
        document.getElementById('chapterTitle').textContent = "Error Loading Chapter";
    }
}

function setupChapterNavigation(story, currentChapterIndex) {
    // Top Navigation
    const homeButtonTop = document.getElementById('homeButtonTop'); // New home button
    const prevChapterButtonTop = document.getElementById('prevChapterTop');
    const nextChapterButtonTop = document.getElementById('nextChapterTop');
    const chapterDropdownTop = document.getElementById('chapterDropdownTop');

    // Bottom Navigation
    const homeButtonBottom = document.getElementById('homeButtonBottom'); // New home button
    const prevChapterButtonBottom = document.getElementById('prevChapterBottom');
    const nextChapterButtonBottom = document.getElementById('nextChapterBottom');
    const chapterDropdownBottom = document.getElementById('chapterDropdownBottom');

    // Set Home button links (always link to the root index.html)
    if (homeButtonTop) homeButtonTop.href = '../../index.html';
    if (homeButtonBottom) homeButtonBottom.href = '../../index.html';


    // Populate dropdowns (function is created here to avoid repetition)
    const populateDropdown = (dropdownElement) => {
        if (!dropdownElement) return;
        dropdownElement.innerHTML = '';
        story.chapters.forEach((chapter, index) => {
            const option = document.createElement('option');
            option.value = `./${chapter.slug}.html`;
            option.textContent = `Chapter ${index + 1}: ${chapter.title}`;
            if (index === currentChapterIndex) {
                option.selected = true;
            }
            dropdownElement.appendChild(option);
        });

        dropdownElement.onchange = (event) => {
            window.location.href = event.target.value;
        };
    };

    populateDropdown(chapterDropdownTop);
    populateDropdown(chapterDropdownBottom);

    // Setup Previous/Next Buttons (function created here to avoid repetition)
    const setupNavButtons = (prevBtn, nextBtn) => {
        if (!prevBtn || !nextBtn) return;

        if (currentChapterIndex > 0) {
            const prevChapter = story.chapters[currentChapterIndex - 1];
            prevBtn.href = `./${prevChapter.slug}.html`;
            prevBtn.classList.remove('hidden');
        } else {
            prevBtn.classList.add('hidden');
        }

        if (currentChapterIndex < story.chapters.length - 1) {
            const nextChapter = story.chapters[currentChapterIndex + 1];
            nextBtn.href = `./${nextChapter.slug}.html`;
            nextBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.add('hidden');
        }
    };

    setupNavButtons(prevChapterButtonTop, nextChapterButtonTop);
    setupNavButtons(prevChapterButtonBottom, nextChapterButtonBottom);
}

// New function for random story suggestions
function displayRandomStorySuggestions(allStoriesData, currentStorySlug) {
    const suggestionsContainer = document.getElementById('storySuggestions');
    if (!suggestionsContainer) {
        console.warn("Story suggestions container not found.");
        return;
    }

    // Filter out the current story
    const availableStories = allStoriesData.filter(story => story.slug !== currentStorySlug);

    if (availableStories.length === 0) {
        suggestionsContainer.innerHTML = '<p style="text-align: center; color: var(--text-dark);">No other stories available for suggestion.</p>';
        return;
    }

    // Shuffle and pick 3 random stories
    const shuffledStories = availableStories.sort(() => 0.5 - Math.random());
    const randomSuggestions = shuffledStories.slice(0, 3);

    if (randomSuggestions.length > 0) {
        suggestionsContainer.innerHTML = `<h3>You might also like:</h3><div id="suggestionsGrid" class="suggestions-grid"></div>`;
        displayStories(randomSuggestions, 'suggestionsGrid', true); // Re-use displayStories with specific container ID, pass true for isSuggestion
    } else {
        suggestionsContainer.innerHTML = '<p style="text-align: center; color: var(--text-dark);">Could not find other stories for suggestions.</p>';
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const isChapterPage = window.location.pathname.includes('/story/');
    let dataBasePath = '';

    if (!isChapterPage) {
        dataBasePath = 'data';
        loadAndDisplayStories(dataBasePath);
        loadAffiliateBanner(dataBasePath);

        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.addEventListener('keyup', filterStories);
        }
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.addEventListener('click', filterStories);
        }

    } else {
        dataBasePath = '../../data';
        const pathSegments = window.location.pathname.split('/');
        const storySlug = pathSegments[pathSegments.length - 2];
        const chapterFileName = pathSegments[pathSegments.length - 1];
        const chapterSlug = chapterFileName.replace('.html', '');

        initializeChapterPage(storySlug, chapterSlug, dataBasePath);
        loadAffiliateBanner(dataBasePath);
    }
});