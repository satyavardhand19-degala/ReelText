# ReelText — Instagram Reel Caption Extractor

A web app that lets users paste an Instagram Reel URL and instantly view the post's caption — in any language including Tamil, Telugu, Hindi, Arabic, and more.

---

## What It Does

1. User pastes an Instagram Reel URL (e.g. `https://www.instagram.com/reel/ABC123/`)
2. The Node.js backend fetches the reel page server-side (bypasses browser CORS restrictions)
3. The **caption/description** is extracted and decoded (including full Unicode/multilingual support)
4. User can copy the text with one click

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | HTML, CSS, Vanilla JavaScript |
| Backend   | Node.js + Express             |
| Fetching  | Axios (server-side)           |
| Hosting   | Railway (recommended)         |

---

## Project Structure

```
ReelText/
├── index.html        # UI
├── style.css         # Styles
├── app.js            # Frontend logic
├── server.js         # Backend (Express API)
├── package.json      # Dependencies + start script
├── .gitignore
├── README.md
├── scope.md
├── specification.md
└── implementation.md
```

---

## Quick Start (Local)

```bash
git clone https://github.com/yourname/ReelText.git
cd ReelText
npm install
node server.js
```

Then open `http://localhost:3000` in your browser.

> **Requires a `SESSION_ID` cookie** for Instagram authentication — see below.

---

## Instagram Session Cookie

Instagram blocks unauthenticated server-side requests. You must provide your `sessionid` cookie:

1. Open Chrome → go to `https://www.instagram.com` (logged in)
2. Press `F12` → **Application** → **Cookies** → `https://www.instagram.com`
3. Copy the value of the `sessionid` cookie

**Run with cookie (PowerShell):**
```powershell
$env:SESSION_ID="your_sessionid_here"; node server.js
```

**Run with cookie (CMD):**
```cmd
set SESSION_ID=your_sessionid_here && node server.js
```

---

## Deployment

See `deploy.md` for the full Railway deployment guide.

---

## Limitations

- Only works with **public** Instagram accounts
- Requires a valid `SESSION_ID` cookie (expires every few weeks)
- Cloud server IPs may occasionally be blocked by Instagram

---

## License

MIT — free to use and modify.
