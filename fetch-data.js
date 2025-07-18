const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');
const fs = require('fs-extra');
const path = require('path');

// --- Configuration ---
// !! IMPORTANT: Replace these with your actual published Google Sheet CSV URLs !!
// Go to File > Share > Publish to web > Choose Sheet > Choose Comma-separated values (.csv)
const GOOGLE_SHEET_AFFILIATES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT67jcSPIYlnqUd7VKAGRbE8awSxXnnQEjQUPuse7GUbaKfcFIAah2ZS6j_Uxc0yaPfbg2w8wm0pSz8/pub?gid=0&single=true&output=csv'; // e.g., 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_XYZ/pub?gid=0&single=true&output=csv'
const GOOGLE_SHEET_STORIES_INDEX_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRi9707BGQFlLbKg71_QzV4-tbYu0iJ1JVfUGD1Z2Qxm4Yez9nJEGLalpXmCFTfwjz4NFe1Yzibifx9/pub?gid=0&single=true&output=csv'; // e.g., 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_ABC/pub?gid=12345&single=true&output=csv'

const OUTPUT_DIR = './'; // Root of your GitHub Pages repo (where index.html, data/, story/ will be generated)
const DATA_DIR = path.join(OUTPUT_DIR, 'data');
const STORY_BASE_DIR = path.join(OUTPUT_DIR, 'story');

// --- Helper Functions ---

/**
 * Fetches and parses CSV data from a URL.
 * @param {string} url - The URL of the CSV file.
 * @returns {Array<Object>} An array of objects, where each object represents a row.
 */
async function fetchCsvData(url) {
    if (!url || url === 'YOUR_AFFILIATES_SHEET_CSV_URL_HERE' || url === 'YOUR_STORIES_INDEX_SHEET_CSV_URL_HERE') {
        throw new Error(`Invalid or placeholder CSV URL: ${url}. Please update the script with your actual Google Sheet URLs.`);
    }
    console.log(`Fetching CSV from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch CSV from ${url}: ${response.statusText} (Status: ${response.status})`);
    }
    const csv = await response.text();
    const records = parse(csv, {
        columns: true, // Treat first row as column headers
        skip_empty_lines: true,
        trim: true     // Trim whitespace from values
    });
    return records;
}

/**
 * Generates the HTML content for a chapter page.
 * @param {string} storyTitle - The title of the story.
 * @param {string} chapterTitle - The title of the current chapter.
 * @param {string} chapterContentHtml - The HTML string of paragraph pairs for the chapter.
 * @param {Object} navLinks - Object containing prev and next chapter URLs.
 * @returns {string} The full HTML content for the chapter page.
 */
function getChapterHtmlTemplate(storyTitle, chapterTitle, chapterContentHtml, navLinks) {
    // Relative path from chapter HTML file (e.g., story/slug/chapter-1.html) to assets (assets/css/styles.css)
    const relativePathToAssets = '../../assets';
    // The main.js script will be shared, so it also needs the relative path.
    // We can rely on main.js using relative paths from its current location,
    // or pass base paths to it if dynamic fetching is needed from main.js.
    // For this setup, main.js fetches data/stories.json from its own location relative to chapter page.
    // So if main.js is at assets/js/main.js and data is at data/,
    // from story/slug/chapter-X.html, it's ../../data/stories.json.
    // The main.js will use ../data/affiliates.json and ../../data/stories.json (for chapter pages)
    // The main.js script itself is loaded with ../../assets/js/main.js

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chapterTitle} - ${storyTitle}</title>
    <link rel="stylesheet" href="${relativePathToAssets}/css/styles.css">
</head>
<body>
    <header class="top-banner" id="topBanner">
        </header>

    <div class="container chapter-container">
        <h1 id="chapterTitle">${chapterTitle}</h1>
        <h2 id="storyTitle">From: ${storyTitle}</h2>

        <div class="chapter-navigation">
            <a href="${navLinks.prev}" id="prevChapter" class="nav-button ${navLinks.prev === '#' ? 'hidden' : ''}">&laquo; Previous Chapter</a>
            <a href="${path.join(OUTPUT_DIR, 'index.html')}" class="nav-button">Back to Stories</a>
            <a href="${navLinks.next}" id="nextChapter" class="nav-button ${navLinks.next === '#' ? 'hidden' : ''}">Next Chapter &raquo;</a>
        </div>

        <div id="affiliateWall" class="affiliate-wall">
            <p>To unlock this chapter and support our work, please visit one of our partners:</p>
            <button id="unlockChapterBtn" class="unlock-button">Unlock Chapter by Visiting a Partner</button>
        </div>

        <div id="chapterContent" class="chapter-content hidden">
            ${chapterContentHtml}
        </div>
    </div>

    <footer>
        <p>&copy; 2025 Dual Language Stories. All rights reserved.</p>
    </footer>

    <script src="${relativePathToAssets}/js/main.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // No need to dynamically get story/chapter slug from URL as content is static
            // initializeChapterPage in main.js is now simplified to only handle wall and banner
            loadAffiliateBanner(); // This now explicitly ensures banner loads on chapter pages
            handleAffiliateWall(); // Ensure affiliate wall logic is executed
        });
    </script>
</body>
</html>`;
}

// --- Main Generation Logic ---
async function generateWebsite() {
    console.log(`[${new Date().toLocaleTimeString()}] Starting website generation...`);

    // Create necessary directories
    await fs.ensureDir(DATA_DIR);
    await fs.ensureDir(STORY_BASE_DIR);

    // 1. Fetch and save Affiliate Links
    console.log(`[${new Date().toLocaleTimeString()}] Fetching affiliate links...`);
    let affiliates = [];
    try {
        affiliates = await fetchCsvData(GOOGLE_SHEET_AFFILIATES_CSV_URL);
        await fs.writeJson(path.join(DATA_DIR, 'affiliates.json'), affiliates, { spaces: 4 });
        console.log(`[${new Date().toLocaleTimeString()}] Saved ${affiliates.length} affiliate links to ${DATA_DIR}/affiliates.json`);
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] ERROR: Could not fetch or save affiliate data: ${error.message}`);
        console.warn(`[${new Date().toLocaleTimeString()}] Continuing without affiliate links. Please ensure GOOGLE_SHEET_AFFILIATES_CSV_URL is correct.`);
    }

    // 2. Fetch Story Index
    console.log(`[${new Date().toLocaleTimeString()}] Fetching stories index...`);
    let storiesIndex = [];
    try {
        storiesIndex = await fetchCsvData(GOOGLE_SHEET_STORIES_INDEX_CSV_URL);
        if (storiesIndex.length === 0) {
            console.warn(`[${new Date().toLocaleTimeString()}] No stories found in the index sheet. Website will be empty.`);
        }
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] ERROR: Could not fetch stories index: ${error.message}`);
        console.error(`[${new Date().toLocaleTimeString()}] Please ensure GOOGLE_SHEET_STORIES_INDEX_CSV_URL is correct and the sheet is published to CSV.`);
        return; // Stop if no stories can be fetched
    }

    const allStoriesData = []; // To store full story data including chapters for stories.json

    // Loop through each story defined in the index
    for (const story of storiesIndex) {
        const storySlug = story.slug;
        const storyTitle = story.title;
        const storyDescription = story.description;
        const storyCoverImageUrl = story.cover_image_url;
        const storyContentCsvUrl = story.content_csv_url; // New column for story content URL

        console.log(`[${new Date().toLocaleTimeString()}] Processing story: "${storyTitle}" (Slug: ${storySlug})`);

        const storyDir = path.join(STORY_BASE_DIR, storySlug);
        await fs.ensureDir(storyDir); // Create directory for each story (e.g., 'story/the-little-prince')

        let storyParagraphs = [];
        try {
            storyParagraphs = await fetchCsvData(storyContentCsvUrl);
            if (storyParagraphs.length === 0) {
                console.warn(`[${new Date().toLocaleTimeString()}] No content found for story "${storyTitle}" at ${storyContentCsvUrl}. Skipping chapters.`);
                continue; // Skip to next story if no paragraphs are found
            }
        } catch (error) {
            console.error(`[${new Date().toLocaleTimeString()}] ERROR: Could not fetch content for story "${storyTitle}" from ${storyContentCsvUrl}: ${error.message}`);
            console.warn(`[${new Date().toLocaleTimeString()}] Please check the 'content_csv_url' for story '${storySlug}' in your index sheet.`);
            continue; // Skip to next story on error
        }

        const chaptersMap = new Map(); // Map to store chapters: { chapter_slug: { title: '...', paragraphs: [] } }

        // Group paragraphs by chapter_slug
        storyParagraphs.forEach((row, index) => {
            // Validate required columns
            if (!row.chapter_slug || !row.chapter_title || row.paragraph_lang1 === undefined || row.paragraph_lang2 === undefined) {
                console.warn(`[${new Date().toLocaleTimeString()}] WARNING: Missing required data in row ${index + 2} of story content for "${storyTitle}". Skipping row.`, row);
                return;
            }

            const currentChapterSlug = row.chapter_slug.trim();
            const currentChapterTitle = row.chapter_title.trim();
            const lang1Content = row.paragraph_lang1.trim();
            const lang2Content = row.paragraph_lang2.trim();

            if (!chaptersMap.has(currentChapterSlug)) {
                chaptersMap.set(currentChapterSlug, {
                    title: currentChapterTitle,
                    paragraphs: []
                });
            }
            chaptersMap.get(currentChapterSlug).paragraphs.push({ lang1: lang1Content, lang2: lang2Content });
        });

        const storyChaptersData = []; // To store chapter metadata for stories.json, in order
        const sortedChapterSlugs = Array.from(chaptersMap.keys()).sort((a, b) => {
            // Basic numeric sort if slugs are 'chapter-1', 'chapter-2', etc.
            const numA = parseInt(a.replace('chapter-', ''), 10);
            const numB = parseInt(b.replace('chapter-', ''), 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return a.localeCompare(b); // Fallback for non-numeric slugs
        });

        for (let i = 0; i < sortedChapterSlugs.length; i++) {
            const currentChapterSlug = sortedChapterSlugs[i];
            const chapterData = chaptersMap.get(currentChapterSlug);
            const chapterTitle = chapterData.title;
            const chapterParagraphs = chapterData.paragraphs;

            let chapterContentHtml = '';
            chapterParagraphs.forEach(p => {
                chapterContentHtml += `
                <div class="paragraph-pair">
                    <p class="lang-one">${p.lang1}</p>
                    <p class="lang-two">${p.lang2}</p>
                </div>
                `;
            });

            // Determine navigation links
            const prevChapterSlug = i > 0 ? sortedChapterSlugs[i - 1] : '#';
            const nextChapterSlug = i < sortedChapterSlugs.length - 1 ? sortedChapterSlugs[i + 1] : '#';

            const navLinks = {
                prev: prevChapterSlug === '#' ? '#' : `./${prevChapterSlug}.html`,
                next: nextChapterSlug === '#' ? '#' : `./${nextChapterSlug}.html`
            };

            const chapterFileName = `${currentChapterSlug}.html`;
            const chapterFilePath = path.join(storyDir, chapterFileName);

            const chapterHtml = getChapterHtmlTemplate(storyTitle, chapterTitle, chapterContentHtml, navLinks);
            await fs.writeFile(chapterFilePath, chapterHtml);
            console.log(`[${new Date().toLocaleTimeString()}] Generated ${chapterFilePath}`);

            storyChaptersData.push({ slug: currentChapterSlug, title: chapterTitle });
        }

        allStoriesData.push({
            slug: storySlug,
            title: storyTitle,
            description: storyDescription,
            cover_image_url: storyCoverImageUrl,
            chapters: storyChaptersData // Store the sorted list of chapters
        });
    }

    // 3. Save the main stories.json file
    await fs.writeJson(path.join(DATA_DIR, 'stories.json'), allStoriesData, { spaces: 4 });
    console.log(`[${new Date().toLocaleTimeString()}] Saved main stories data to ${DATA_DIR}/stories.json`);

    // 4. Generate index.html (home page)
    console.log(`[${new Date().toLocaleTimeString()}] Generating index.html...`);

    const indexStoryCardsHtml = allStoriesData.length > 0 ? allStoriesData.map(story => {
        // Ensure story.chapters[0] exists before trying to access its slug
        const firstChapterLink = story.chapters.length > 0 ? `story/${story.slug}/${story.chapters[0].slug}.html` : '#';
        return `
        <a href="${firstChapterLink}" class="story-card">
            ${story.cover_image_url ? `<img src="${story.cover_image_url}" alt="${story.title} Cover">` : ''}
            <div class="story-card-content">
                <h3>${story.title}</h3>
                <p>${story.description}</p>
                <span class="read-link">Read Story</span>
            </div>
        </a>
        `;
    }).join('') : '<p>No stories available yet. Please check back later!</p>';

    const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dual Language Stories - Learn with Reading</title>
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
    <header class="top-banner" id="topBanner">
        </header>

    <div class="container">
        <h1>Welcome to Dual Language Stories!</h1>
        <p class="tagline">Read engaging stories side-by-side in two languages to boost your learning.</p>

        <div id="storiesList" class="stories-grid">
            ${indexStoryCardsHtml}
        </div>
    </div>

    <footer>
        <p>&copy; 2025 Dual Language Stories. All rights reserved.</p>
    </footer>

    <script src="assets/js/main.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // For the index page, stories are now statically generated, no need for loadStories()
            loadAffiliateBanner(); // Load banner on index page
        });
    </script>
</body>
</html>`;

    await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), indexHtmlContent);
    console.log(`[${new Date().toLocaleTimeString()}] Generated index.html`);

    console.log(`[${new Date().toLocaleTimeString()}] Website generation complete!`);
}

// Run the generation script
generateWebsite().catch(error => {
    console.error(`[${new Date().toLocaleTimeString()}] FATAL ERROR during website generation:`, error);
});