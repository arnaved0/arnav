# Arnav Saraf – Engineering Portfolio

A static portfolio site with two styles and a built-in editor. There are no build tools: upload the files and it works on GitHub Pages or any static host.

- **Motion**: an animated layout inspired by [getartcraft.com](https://getartcraft.com/). It has a wide display wordmark, rotating rings in the hero, a scrolling keyword banner, scroll-triggered reveals, a sticky experience timeline, a scroll ruler and a dark mode.
- **Classic**: the original layout from [arnavsaraf](https://github.com/arnaved0/arnavsaraf), with its Light / Dark / Blue themes.

## Editing content

Open `editor.html` on the live site (for example `https://arnaved0.github.io/arnav/editor.html`).

- The left panel edits every piece of content: profile, hero text, about paragraphs, projects, experience, focus keywords, contact links and footer. The right panel is a live preview with desktop, tablet and mobile sizes.
- **Style** (top bar) switches between Motion and Classic. The choice is saved to `content.js` and becomes what visitors see.
- **Images**: paste a URL or path, or click *Upload image*. Large photos are scaled to 1600 px. Uploaded files go to `assets/uploads/` when you publish.
- **Resume**: paste a link or upload a PDF.
- Lists can be added to, reordered with ↑ ↓, and deleted.
- In headlines, wrap words in `[brackets]` to highlight them in blue (Motion style).
- Changes are saved as a draft in your browser until you publish. *Discard draft* reverts to the published `content.js`.

### Publishing

Click **Publish**. It commits `content.js` and any uploaded files to the repository in a single commit, and GitHub Pages updates about a minute later.

Publishing needs a GitHub fine-grained personal access token:

1. Go to <https://github.com/settings/personal-access-tokens/new>.
2. Under *Repository access*, choose *Only select repositories* and pick this repository.
3. Under *Permissions → Repository permissions*, set **Contents** to **Read and write**.
4. Paste the token into the Publish dialog. It is stored only in your browser (for the session, or on the device if you tick *Remember*) and is sent only to `api.github.com`. *Forget token* removes it.

The editor page is public, but nobody can publish without your token. Publishing overwrites `content.js`, so if you edit that file by hand on GitHub, reload the editor before publishing again.

**Download content.js** saves the file without publishing, so you can commit it yourself.

## Files

| File | Purpose |
| --- | --- |
| `content.js` | All site content and settings. The editor writes this file. |
| `index.html` | The page. Loads the stylesheet chosen in `content.js`. |
| `css/motion.css`, `css/classic.css` | The two styles. Colors are grouped under `THEME COLORS` at the top. |
| `js/motion.js`, `js/classic.js` | Build the page for each style. |
| `js/site.js`, `js/common.js` | Startup, live preview and shared helpers. |
| `editor.html`, `js/editor.js`, `css/editor.css` | The editor. |
| `assets/` | Images, logos and the resume PDF. |

To compare styles without changing the saved setting, add `?style=classic` or `?style=motion` to the page URL.

## Accessibility and readability

- Animations are short and play once. Text is never hidden behind effects once it is on screen.
- With the operating system's *reduce motion* setting on, all animation is switched off and content is shown immediately.
- All content is inserted as plain text, and links are limited to `http(s)`, `mailto:`, `tel:` and relative paths.

## Running locally

Open `index.html` directly in a browser, or serve the folder with any static server. The editor's live preview and publish feature work best when served over `http(s)`.
