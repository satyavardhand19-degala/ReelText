const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

const SESSION_ID = process.env.SESSION_ID || "";

if (SESSION_ID) {
  console.log("Session cookie loaded — authenticated requests enabled.");
} else {
  console.log("No SESSION_ID set — running without authentication (may hit login wall).");
}

function buildHeaders() {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
  };
  if (SESSION_ID) {
    headers["Cookie"] = `sessionid=${SESSION_ID}`;
  }
  return headers;
}

const BACKSLASH = String.fromCharCode(92);

function decodeJsonString(str) {
  let result = "";
  let i = 0;
  while (i < str.length) {
    if (str[i] === BACKSLASH && i + 1 < str.length) {
      const next = str[i + 1];
      if (next === "u" && i + 5 < str.length) {
        const hex = str.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          result += String.fromCodePoint(parseInt(hex, 16));
          i += 6;
          continue;
        }
      }
      if (next === "n")  { result += "\n";      i += 2; continue; }
      if (next === "t")  { result += "\t";      i += 2; continue; }
      if (next === '"')  { result += '"';       i += 2; continue; }
      if (next === BACKSLASH) { result += BACKSLASH; i += 2; continue; }
    }
    result += str[i];
    i++;
  }
  return result;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

app.get("/api/debug", async (req, res) => {
  const { shortcode } = req.query;
  if (!shortcode) return res.status(400).json({ error: "shortcode required" });
  const pageUrl = `https://www.instagram.com/reel/${shortcode}/`;
  try {
    const response = await axios.get(pageUrl, { headers: buildHeaders(), timeout: 12000 });
    const html = response.data;
    const ldJson = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1].slice(0, 300));
    const gqlRaw = html.match(/"caption"\s*:\s*\{\s*"text"\s*:\s*"((?:[^"\\]|\\.){0,200})/)?.[1] || null;
    const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]{0,200})"/)?.[1] || null;
    const charCodes = gqlRaw ? [...gqlRaw.slice(0, 30)].map(c => c.charCodeAt(0)) : [];
    res.json({ ldJsonCount: ldJson.length, ldJsonSamples: ldJson, gqlRaw, ogDesc, charCodesOfGql: charCodes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/caption", async (req, res) => {
  const { shortcode } = req.query;
  if (!shortcode) return res.status(400).json({ error: "shortcode required" });

  const urls = [
    `https://www.instagram.com/reel/${shortcode}/`,
    `https://www.instagram.com/p/${shortcode}/`,
  ];

  for (const pageUrl of urls) {
    try {
      const response = await axios.get(pageUrl, {
        headers: buildHeaders(),
        timeout: 12000,
        maxRedirects: 5,
      });

      const html = response.data;

      // Strategy A: JSON-LD structured data
      const ldJsonMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      for (const match of ldJsonMatches) {
        try {
          const json = JSON.parse(match[1]);
          const rawDesc = json.description || json.caption || "";
          const authorName =
            json.author?.identifier?.value ||
            json.author?.name ||
            "unknown";
          if (rawDesc) {
            console.log("Strategy A matched, raw[0..80]:", JSON.stringify(rawDesc.slice(0, 80)));
            return res.json({
              caption: decodeJsonString(rawDesc),
              username: decodeJsonString(authorName),
              profileUrl: `https://instagram.com/${authorName}`,
            });
          }
        } catch (_) {}
      }

      // Strategy B: inline GraphQL data blob
      const gqlMatch = html.match(/"caption"\s*:\s*\{\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (gqlMatch) {
        console.log("Strategy B matched, raw[0..80]:", JSON.stringify(gqlMatch[1].slice(0, 80)));
        const caption = decodeJsonString(gqlMatch[1]);
        const userMatch = html.match(/"username"\s*:\s*"([^"]+)"/);
        const username = userMatch ? decodeJsonString(userMatch[1]) : "unknown";
        return res.json({
          caption,
          username,
          profileUrl: `https://instagram.com/${username}`,
        });
      }

      // Strategy C: og:description meta tag
      const ogMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/);
      if (ogMatch) {
        console.log("Strategy C matched, raw[0..80]:", JSON.stringify(ogMatch[1].slice(0, 80)));
        const caption = decodeJsonString(decodeHtmlEntities(ogMatch[1]));
        const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/);
        const rawTitle = titleMatch ? decodeJsonString(decodeHtmlEntities(titleMatch[1])) : "";
        const username = rawTitle.match(/@([\w.]+)/)?.[1] || "unknown";
        return res.json({
          caption,
          username,
          profileUrl: `https://instagram.com/${username}`,
        });
      }
      console.log("No strategy matched — sending 422");
      console.log("HTML snippet:", html.slice(0, 500));
    } catch (err) {
      if (err.response?.status === 404) continue;
    }
  }

  res.status(422).json({
    error:
      "Instagram returned a login page or blocked the request. " +
      "The reel must be public. Try again or add a sessionid cookie (see README).",
  });
});

// Self-test: verify decodeJsonString works at startup
const _test = decodeJsonString(String.fromCharCode(92) + "u0c2e" + String.fromCharCode(92) + "u0c41");
console.log("Decode self-test (should be 'ము'):", _test);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ReelDesc v2 running → http://localhost:${PORT}`);
});
