const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');
const fs = require('fs-extra');
const path = require('path');

// --- Configuration ---
// !! IMPORTANT: Replace these with your actual published Google Sheet CSV URLs !!
const GOOGLE_SHEET_AFFILIATES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT67jcSPIYlnqUd7VKAGRbE8awSxXnnQEjQUPuse7GUbaKfcFIAah2ZS6j_Uxc0yaPfbg2w8wm0pSz8/pub?gid=0&single=true&output=csv';
const GOOGLE_SHEET_STORIES_INDEX_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRi9707BGQFlLbKg71_QzV4-tbYu0iJ1JVfUGD1Z2Qxm4Yez9nJEGLalpXmCFTfwjz4NFe1Yzibifx9/pub?gid=0&single=true&output=csv';

// Assuming script is run from the 'lidlliesel' directory (repo root)
const OUTPUT_DIR = './';
const DATA_DIR = path.join(OUTPUT_DIR, 'data');
const STORY_BASE_DIR = path.join(OUTPUT_DIR, 'story');

// --- Helper Functions ---

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
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    if (records.length > 0) {
        console.log(`[DEBUG] First record's keys (from ${url}):`, Object.keys(records[0]));
        console.log(`[DEBUG] First record (from ${url}):`, records[0]);
    }

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
    const relativePathToAssets = '../../assets';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chapterTitle} - ${storyTitle}</title>
    <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${relativePathToAssets}/css/styles.css">
</head>
<body>
    <header class="top-banner" id="topBanner">
        </header>

    <div class="container chapter-container">
        <h1 id="chapterTitle">${chapterTitle}</h1>
        <h2 id="storyTitle">From: ${storyTitle}</h2>

        <div class="chapter-navigation">
            <a href="../../index.html" id="homeButtonTop" class="nav-button">Trang chủ</a>
            <a href="${navLinks.prev}" id="prevChapterTop" class="nav-button ${navLinks.prev === '#' ? 'hidden' : ''}">&laquo; Chương trước</a>
            <select id="chapterDropdownTop" class="chapter-dropdown"></select>
            <a href="${navLinks.next}" id="nextChapterTop" class="nav-button ${navLinks.next === '#' ? 'hidden' : ''}">Chương sau &raquo;</a>
        </div>

        <div id="affiliateWall" class="affiliate-wall">
            <p>Chúng mình xin bạn 5s để ấn link này và ủng hộ page phát triển nhé:</p>
            <button id="unlockChapterBtn" class="unlock-button">Mở khóa chương truyện</button>
        </div>

        <div id="chapterContent" class="chapter-content hidden">
            ${chapterContentHtml}
        </div>

        <div class="chapter-navigation bottom">
            <a href="../../index.html" id="homeButtonBottom" class="nav-button">Trang chủ</a>
            <a href="${navLinks.prev}" id="prevChapterBottom" class="nav-button ${navLinks.prev === '#' ? 'hidden' : ''}">&laquo; Chương trước</a>
            <select id="chapterDropdownBottom" class="chapter-dropdown"></select>
            <a href="${navLinks.next}" id="nextChapterBottom" class="nav-button ${navLinks.next === '#' ? 'hidden' : ''}">Chương sau &raquo;</a>
        </div>

        <div id="storySuggestions" class="story-suggestions">
            </div>

    </div>

    <footer>
        Ghé chơi với page ở:
        <a href="https://www.tiktok.com/@tiengductvtiktok" target="_blank">TikTok</a> |
        <a href="https://www.facebook.com/profile.php?id=61554503077216" target="_blank">Facebook</a>
    </footer>

    <script src="${relativePathToAssets}/js/main.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const pathSegments = window.location.pathname.split('/');
            const storySlug = pathSegments[pathSegments.length - 2];
            const chapterFileName = pathSegments[pathSegments.length - 1];
            const chapterSlug = chapterFileName.replace('.html', '');

            initializeChapterPage(storySlug, chapterSlug, '../../data'); // Pass dataPath directly here too
            loadAffiliateBanner('../../data'); // Pass dataPath directly here too
        });
    </script>
</body>
</html>`;
}

// --- Main Generation Logic (no changes needed here, only in template function) ---
async function generateWebsite() {
    console.log(`[${new Date().toLocaleTimeString()}] Starting website generation...`);

    // Ensure output directories exist relative to OUTPUT_DIR
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
        const storyContentCsvUrl = story.content_csv_url;

        console.log(`[${new Date().toLocaleTimeString()}] Processing story: "${storyTitle}" (Slug: ${storySlug})`);

        const storyDir = path.join(STORY_BASE_DIR, storySlug);
        await fs.ensureDir(storyDir);

        let storyParagraphs = [];
        try {
            storyParagraphs = await fetchCsvData(storyContentCsvUrl);
            if (storyParagraphs.length === 0) {
                console.warn(`[${new Date().toLocaleTimeString()}] No content found for story "${storyTitle}" at ${storyContentCsvUrl}. Skipping chapters.`);
                continue;
            }
        } catch (error) {
            console.error(`[${new Date().toLocaleTimeString()}] ERROR: Could not fetch content for story "${storyTitle}" from ${storyContentCsvUrl}: ${error.message}`);
            console.warn(`[${new Date().toLocaleTimeString()}] Please check the 'content_csv_url' for story '${storySlug}' in your index sheet.`);
            continue;
        }

        const chaptersMap = new Map(); // Map to store chapters: { chapter_slug: { title: '...', paragraphs: [] } }

        // Group paragraphs by chapter_slug
        storyParagraphs.forEach((row, index) => {
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
            const numA = parseInt(a.replace('chapter-', ''), 10);
            const numB = parseInt(b.replace('chapter-', ''), 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return a.localeCompare(b);
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
            chapters: storyChaptersData
        });
    }

    // 3. Save the main stories.json file
    await fs.writeJson(path.join(DATA_DIR, 'stories.json'), allStoriesData, { spaces: 4 });
    console.log(`[${new Date().toLocaleTimeString()}] Saved main stories data to ${DATA_DIR}/stories.json`);

    // 4. Generate index.html (home page)
    console.log(`[${new Date().toLocaleTimeString()}] Generating index.html...`);

    const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TiengDucTV - Học rất nhàn khi mình đọc rất nhiều</title>
    <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
    <header class="top-banner" id="topBanner">
        </header>

    <div class="container">
        <h1>Chào mừng đến với trang tổng hợp truyện của TiengDucTV!</h1>
        <p class="tagline">Hiện các truyện đang được update song ngữ Đức - Việt, sắp tới sẽ có thêm tiếng Anh. Mọi người có yêu cầu truyện nào cứ ib page (tiktok/facebook) nha. Chúc mọi người đọc truyện vui và tiện thể học mót thêm ít ngoại ngữ nè 🫶</p>

        <div class="search-container">
            <input type="text" id="searchBox" placeholder="Tìm theo tên truyện hoặc tên chương...">
            <button id="searchButton">Search</button>
        </div>

        <h2>Tất cả truyện</h2>
        <div id="storiesList" class="stories-grid">
            <p id="loadingStories">Loading stories...</p>
            </div>
    </div>

<footer>
    Ghé chơi với page ở:
    <a href="https://www.tiktok.com/@tiengductvtiktok" target="_blank">TikTok</a> |
    <a href="https://www.facebook.com/profile.php?id=61554503077216" target="_blank">Facebook</a>
</footer>

    <script src="assets/js/main.js"></script>
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