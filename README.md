# lidlliesel
A bilingual story reading website

| Artifact                          | Description                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `stories.json`                    | Contains all stories, chapters, paragraphs (both languages).                                                             |
| `affiliates.json`                 | Contains affiliate links + metadata.                                                                                     |
| HTML templates                    | Story list page, story detail page, chapter page with side-by-side layout.                                               |
| CSS                               | Responsive, clean design with side-by-side grid and aligned paragraphs.                                                  |
| JS                                | Logic for unlocking chapters after link click, randomized link assignment, and paragraph alignment adjustment if needed. |
| Google Sheet (Stories & Chapters) | Master sheet with columns: story slug, chapter number, paragraph number, language 1 text, language 2 text.               |
| Google Sheet (Affiliate Links)    | List of URLs + optional metadata.                                                                                        |

## Implementation Steps

### Setup Phase
Create a free GitHub account and repository for the site.

Enable GitHub Pages in the repository settings, set it to deploy from main branch or /docs folder.

Reserve a domain name (optional, otherwise use the *.github.io URL).

### Content Management
Set up two Google Sheets:

Stories & Chapters:
| story_slug | story_title | chapter_num | chapter_title | para_num | lang1_text | lang2_text |

Affiliate Links:
| link_url | product_name | image_url | alt_text |

Publish both sheets as CSV (File → Share → Publish to web → CSV format).

Write a script (scripts/fetch-data.js) to fetch those CSVs, convert to JSON (data/stories.json and data/affiliates.json) for the site. Or manually export CSV → JSON during build if desired.

### Frontend Development
Design the HTML templates:

index.html: loops through stories.json → lists all stories with cover, title, description.

story/story-slug/chapter-n.html: reads story/chapter/paragraphs from stories.json → generates side-by-side layout.

Implement CSS grid or flexbox to align paragraphs top-wise while allowing variable length text. Use <div class="row"><div class="col left">…</div><div class="col right">…</div></div>.

Add JS logic:

On page load: display overlay “Unlock by visiting partner”.

Choose a random URL from affiliates.json.

Show affiliate banner at top with random affiliate.

On click of the unlock button: open affiliate link in new tab, hide overlay, reveal chapter.

Optional: use localStorage to remember unlocked chapters during a session.

### Deployment
Push all code to the GitHub repository.

Visit the site’s URL (https://yourusername.github.io/your-repo), test.

### Maintenance Workflow
To add/edit stories or links:

Update the Google Sheets.

Re-export to JSON using the provided script or manually.

Commit updated data/stories.json and data/affiliates.json to GitHub.

Push to trigger site rebuild.

## Ask ChatGPT
https://chatgpt.com/c/687a9bc6-a9bc-8004-80bf-98d28e9750a2
