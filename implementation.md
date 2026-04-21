# Implementation Guide — ReelDesc

## 1. Project Setup

```bash
git clone https://github.com/yourname/reeldesc.git
cd reeldesc
npm install
```

**Dependencies:**
| Package  | Purpose                        |
|----------|--------------------------------|
| express  | HTTP server + static file serving |
| axios    | Server-side HTTP requests to Instagram |
| cors     | Enable CORS for local development |

---

## 2. Running Locally

**Without session cookie (limited — may hit login wall):**
```bash
node server.js
```

**With session cookie (recommended):**

PowerShell:
```powershell
$env:SESSION_ID="your_sessionid_here"; node server.js
```

CMD:
```cmd
set SESSION_ID=your_sessionid_here && node server.js
```

Open `http://localhost:3000` in your browser.

---

## 3. File Breakdown

### server.js — Backend

**Key functions:**

| Function | Description |
|----------|-------------|
| `buildHeaders()` | Returns browser-like headers including `Cookie: sessionid=...` if SESSION_ID is set |
| `decodeJsonString(str)` | Decodes `\uXXXX` Unicode escapes character by character — handles Tamil, Telugu, Hindi, Arabic etc. |
| `decodeHtmlEntities(str)` | Decodes HTML entities like `&amp;`, `&#39;`, `&#x0C2E;` |
| `GET /api/caption` | Main endpoint — fetches Instagram page and tries 3 extraction strategies |
| `GET /api/debug` | Debug endpoint — returns raw match data from all 3 strategies |

**Extraction flow:**
```
Fetch Instagram page
        │
        ├─ Strategy A: JSON-LD <script type="application/ld+json">
        │     └─ JSON.parse() → description field → decodeJsonString()
        │
        ├─ Strategy B: GraphQL blob "caption":{"text":"..."}
        │     └─ String search → decodeJsonString()
        │
        └─ Strategy C: <meta property="og:description">
              └─ Regex → decodeHtmlEntities() → decodeJsonString()
```

---

### app.js — Frontend

**Key functions:**

| Function | Description |
|----------|-------------|
| `extractCaption()` | Validates URL, calls `/api/caption`, renders result |
| `getShortcode(url)` | Extracts the shortcode ID from the Instagram URL |
| `showResult({username, caption, profileUrl})` | Populates and shows the result card |
| `copyCaption()` | Copies caption to clipboard, shows "Copied!" confirmation |
| `getInitials(name)` | Generates 1-2 letter avatar initials from username |
| `setLoading(on)` | Toggles spinner and disables/enables the Extract button |

---

### index.html — UI Structure

```
.container
├── header          → Logo + tagline
├── .input-card     → URL input + Extract button + error message
├── #loader         → Spinner (hidden by default)
└── #result-card    → Avatar + username + caption + Copy button
```

---

### style.css — Design Tokens

```css
--pink:            #f058a4   /* Primary accent */
--purple:          #a855f7   /* Secondary accent */
--surface:         #ffffff   /* Card background */
--surface-2:       #f9f7ff   /* Input background */
--text-primary:    #1a1a2e   /* Main text */
--text-secondary:  #6b6b8a   /* Subtext */
--radius:          16px      /* Card border radius */
```

---

## 4. Environment Variables

| Variable   | Required | Description                                      |
|------------|----------|--------------------------------------------------|
| SESSION_ID | Yes (recommended) | Instagram `sessionid` cookie value   |
| PORT       | No       | Server port (defaults to 3000, Railway sets this automatically) |

---

## 5. Getting the sessionid Cookie

1. Open Chrome/Edge → go to `https://www.instagram.com` (logged in)
2. Press `F12` → **Application** tab → **Storage** → **Cookies** → `https://www.instagram.com`
3. Find `sessionid` row → copy the **Value**
4. The cookie expires every few weeks — repeat when the app returns login errors

---

## 6. Deployment (Railway)

See `deploy.md` for the full step-by-step guide.

Quick summary:
1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Set `SESSION_ID` in Railway environment variables
4. Generate a domain in Railway settings

---

## 7. Known Limitations

- Instagram may block requests from cloud server IPs (residential IPs work better)
- `sessionid` cookie expires periodically and must be refreshed
- Very long captions may be truncated if only Strategy C (og:description) matches
- Private accounts always return a login page regardless of cookie

---

## 8. Future Improvements

| Feature                  | Approach                                          |
|--------------------------|---------------------------------------------------|
| Hashtag highlighting     | Regex-replace `#word` with styled `<span>`        |
| Mention linking          | Regex-replace `@user` with Instagram profile link |
| Caption history          | Store in `sessionStorage`                         |
| Dark/light mode toggle   | CSS class swap on `<body>`                        |
| Auto cookie refresh      | Prompt user to paste a new cookie in the UI       |
| Rate limiting            | Express middleware to prevent abuse               |
