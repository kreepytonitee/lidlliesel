# lidlliesel
A bilingual story reading website

A static site for bilingual story reading with affiliate monetization.

## Structure
- `index.html` – story list
- `/story/<slug>/chapter-<n>.html` – chapter page
- `/data/` – stories & affiliate JSONs (exported from Google Sheets)
- `/assets/css/` – styling
- `/assets/js/` – JS for affiliate wall & logic
- `/scripts/` – fetch-data.js for building JSON

## Workflow
1. Update content in Google Sheets.
2. Export sheets as CSV and run `node scripts/fetch-data.js` to regenerate `data/*.json`.
3. Commit & push to GitHub.
4. GitHub Pages serves updated site.

## Ask ChatGPT
https://chatgpt.com/c/687a9bc6-a9bc-8004-80bf-98d28e9750a2

## Todo
Fix all text given
Upload first 3 short and 1 long story
Add background image
### Future
Redo shopee ads flow
Add story tags and filter by tag
Country based ads
Domain