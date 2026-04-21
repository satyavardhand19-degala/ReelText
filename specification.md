# Technical Specification — ReelDesc

## 1. Overview

ReelText is a Node.js + Express web app. The frontend (HTML/CSS/JS) is served as static files by the same Express server. The backend handles all Instagram requests server-side to avoid CORS restrictions and browser-level blocking.

---

## 2. Architecture

```
Browser (index.html + app.js)
        │
        │  GET /api/caption?shortcode=XXXX
        ▼
Express Server (server.js)
        │
        │  axios.get("https://www.instagram.com/reel/XXXX/")
        │  with SESSION_ID cookie + browser-like headers
        ▼
Instagram HTML Page
        │
        │  Parse with 3 strategies
        ▼
JSON response → { caption, username, profileUrl }
        │
        ▼
Browser renders result card
```

---

## 3. API Endpoint

### `GET /api/caption`

| Parameter  | Type   | Required | Description                        |
|------------|--------|----------|------------------------------------|
| shortcode  | string | yes      | Instagram reel/post shortcode ID   |

**Success Response (200):**
```json
{
  "caption": "Caption text here in any language",
  "username": "instagram_username",
  "profileUrl": "https://instagram.com/instagram_username"
}
```

**Error Response (422):**
```json
{
  "error": "Instagram returned a login page or blocked the request."
}
```

---

## 4. Extraction Strategies

The server tries 3 strategies in order, stopping at the first success:

### Strategy A — JSON-LD structured data
Parses `<script type="application/ld+json">` blocks in the HTML.
- Most reliable when available
- `JSON.parse()` natively decodes Unicode escapes
- Then `decodeJsonString()` applied as safety pass

### Strategy B — Inline GraphQL data blob
Searches for `"caption":{"text":"..."}` pattern in embedded script data.
- Captures raw string including `\uXXXX` escape sequences
- `decodeJsonString()` decodes all Unicode escapes character by character

### Strategy C — og:description meta tag
Falls back to `<meta property="og:description">` content.
- May be truncated for long captions
- `decodeHtmlEntities()` + `decodeJsonString()` both applied

---

## 5. Unicode Decoding

Instagram encodes non-ASCII characters as `\uXXXX` JSON escape sequences in their HTML. The `decodeJsonString()` function processes these character by character:

```
Input:  "\u0c2e\u0c41\u0c16\u0c4d\u0c2f\u0c2e\u0c02\u0c24\u0c4d\u0c30\u0c3f"
Output: "ముఖ్యమంత్రి"  (Telugu)
```

Handled escape sequences: `\uXXXX`, `\n`, `\t`, `\"`, `\\`

---

## 6. Input Validation

### URL Pattern (frontend)
```js
/^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_\-]+\/?(\?.*)?$/
```
Accepts shortcodes followed by optional query parameters (e.g. `?igsh=...`).

### Shortcode Extraction
```js
url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_\-]+)/)
```

---

## 7. Authentication

Instagram requires a logged-in session for most requests. The server reads the `SESSION_ID` environment variable and attaches it as a cookie header:

```
Cookie: sessionid=<SESSION_ID>
```

Without this, Instagram returns a login page and all strategies fail.

---

## 8. UI States

| State   | Behaviour                                          |
|---------|----------------------------------------------------|
| Idle    | Input visible, result card hidden                  |
| Loading | Spinner shown, Extract button disabled             |
| Success | Result card shown with avatar, username, caption   |
| Error   | Red error message shown below input                |

---

## 9. Error Messages

| Scenario              | Message                                                         |
|-----------------------|-----------------------------------------------------------------|
| Empty input           | "Please paste an Instagram Reel URL first."                    |
| Invalid URL           | "That doesn't look like a valid Instagram Reel link."          |
| Instagram blocked     | "Instagram returned a login page or blocked the request..."    |
| Network error         | "Network error — make sure the server is running."             |

---

## 10. Security

- No user data stored (no cookies, no database, no localStorage)
- Caption rendered via `textContent` — no XSS risk
- `SESSION_ID` only in server environment variable, never sent to frontend
- CORS enabled on the Express server for local development

---

## 11. Browser Compatibility

| Browser       | Minimum Version |
|---------------|-----------------|
| Chrome        | 80+             |
| Firefox       | 75+             |
| Safari        | 13+             |
| Edge          | 80+             |
| Mobile Chrome | 80+             |
| Mobile Safari | 13+             |

---

## 12. Performance

| Metric              | Target |
|---------------------|--------|
| Caption fetch time  | < 3s   |
| Total page size     | < 150KB|
| Time to Interactive | < 1.5s |
