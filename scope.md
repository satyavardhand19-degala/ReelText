# Scope — ReelDesc

## Project Goal

Build a web app with a Node.js backend that extracts and displays the caption of any public Instagram Reel when a user pastes the reel URL. Supports all languages including Tamil, Telugu, Hindi, Arabic, etc.

---

## In Scope

### Core Features
- [x] URL input field accepting Instagram Reel and Post links
- [x] Server-side fetch of Instagram reel page (bypasses CORS)
- [x] 3-strategy caption extraction (JSON-LD → GraphQL blob → og:description)
- [x] Full Unicode decoding — `\uXXXX` escape sequences decoded correctly
- [x] Multilingual caption support (Tamil, Telugu, Hindi, Arabic, etc.)
- [x] Display author username + link to profile
- [x] One-click **Copy to Clipboard**
- [x] Input validation with clear error messages
- [x] Loading spinner during fetch
- [x] Responsive design (mobile + desktop)
- [x] Auto-extract on URL paste

### Supported URL Formats
- `https://www.instagram.com/reel/XXXXXXX/`
- `https://www.instagram.com/reel/XXXXXXX/?igsh=...` (shared links with query params)
- `https://www.instagram.com/p/XXXXXXX/` (posts)

---

## Out of Scope

- Login / OAuth with Instagram
- Downloading the actual video
- Fetching comments, likes, or view counts
- Support for private accounts
- Batch processing multiple URLs
- Storing caption history (no database)
- Browser extension version
- Hashtag analytics or NLP processing

---

## Target Users

| User Type          | Use Case                                          |
|--------------------|---------------------------------------------------|
| Content creators   | Copy their own captions for repurposing           |
| Social media mgrs  | Extract captions for reporting or archiving       |
| Researchers        | Collect captions for analysis                     |
| General public     | Quickly read a caption without opening Instagram  |

---

## Constraints

- Requires a Node.js backend (not a static site)
- Requires a valid Instagram `SESSION_ID` cookie for authenticated requests
- Must support non-English captions with correct Unicode rendering
- Must work on Chrome, Firefox, Safari (mobile and desktop)

---

## Success Criteria

1. Given a valid public reel URL → caption appears within 3 seconds
2. Non-English captions (Tamil, Telugu, Hindi, etc.) display as proper script, not `\uXXXX`
3. Given an invalid URL → clear, friendly error message shown
4. Copy button copies exact caption text to clipboard
5. Works on mobile and desktop browsers
