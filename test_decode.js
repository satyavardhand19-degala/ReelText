const axios = require("axios");
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
          i += 6; continue;
        }
      }
      if (next === "n") { result += "\n"; i += 2; continue; }
      if (next === "t") { result += "\t"; i += 2; continue; }
      if (next === '"') { result += '"'; i += 2; continue; }
      if (next === BACKSLASH) { result += BACKSLASH; i += 2; continue; }
    }
    result += str[i]; i++;
  }
  return result;
}

axios.get("https://www.instagram.com/p/DXV3xceE4RZ/", {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  },
  timeout: 12000,
}).then(r => {
  const html = r.data;

  // Strategy A
  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldMatch) {
    try {
      const j = JSON.parse(ldMatch[1]);
      const desc = j.description || j.caption || "";
      console.log("=== Strategy A ===");
      console.log("raw[0..80]:", JSON.stringify(desc.slice(0, 80)));
      console.log("char codes[0..5]:", [...desc.slice(0, 6)].map(c => c.charCodeAt(0)));
      console.log("decoded[0..80]:", decodeJsonString(desc).slice(0, 80));
    } catch (e) { console.log("A parse failed:", e.message); }
  } else {
    console.log("Strategy A: no JSON-LD found");
  }

  // Strategy B - find "text":"..." after "caption":{
  const captionIdx = html.indexOf('"caption":{"text":"');
  let gm = null;
  if (captionIdx !== -1) {
    const start = captionIdx + '"caption":{"text":"'.length;
    let end = start;
    while (end < html.length && html[end] !== '"') {
      if (html[end] === BACKSLASH) end++; // skip escaped char
      end++;
    }
    gm = [null, html.slice(start, end)];
  }
  if (gm) {
    console.log("=== Strategy B ===");
    console.log("raw[0..80]:", JSON.stringify(gm[1].slice(0, 80)));
    console.log("char codes[0..5]:", [...gm[1].slice(0, 6)].map(c => c.charCodeAt(0)));
    console.log("decoded[0..80]:", decodeJsonString(gm[1]).slice(0, 80));
  } else {
    console.log("Strategy B: no match");
  }

  // Strategy C
  const om = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/);
  if (om) {
    console.log("=== Strategy C ===");
    console.log("raw[0..80]:", JSON.stringify(om[1].slice(0, 80)));
    console.log("char codes[0..5]:", [...om[1].slice(0, 6)].map(c => c.charCodeAt(0)));
    console.log("decoded[0..80]:", decodeJsonString(om[1]).slice(0, 80));
  } else {
    console.log("Strategy C: no match");
  }

  if (!ldMatch && !gm && !om) {
    console.log("No strategy matched. HTML snippet:", html.slice(0, 300));
  }
}).catch(e => console.log("Fetch error:", e.message));
