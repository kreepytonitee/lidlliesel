const fs = require('fs');
const https = require('https');
const csv = require('csv-parser');

function fetchCSV(url, outFile) {
  const results = [];
  https.get(url, res => {
    res.pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
        console.log(outFile + ' written');
      });
  });
}

// Replace URLs below with your actual published CSV links:
fetchCSV(
  'https://docs.google.com/spreadsheets/d/your_story_sheet/export?format=csv',
  'data/stories.json'
);

fetchCSV(
  'https://docs.google.com/spreadsheets/d/your_affiliate_sheet/export?format=csv',
  'data/affiliates.json'
);
