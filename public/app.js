const URL_PATTERN = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_\-]+\/?(\?.*)?$/;

function getShortcode(url) {
  const m = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_\-]+)/);
  return m ? m[1] : null;
}

function getInitials(name) {
  return name
    .replace(/[^a-zA-Z0-9_ ]/g, "")
    .trim()
    .split(/[\s_]+/)
    .slice(0, 2)
    .map(w => w[0] ? w[0].toUpperCase() : "")
    .join("") || "IG";
}

function showError(msg) {
  const el = document.getElementById("error-msg");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError() {
  document.getElementById("error-msg").classList.add("hidden");
}

function setLoading(on) {
  document.getElementById("loader").classList.toggle("hidden", !on);
  const btn = document.getElementById("extract-btn");
  btn.disabled = on;
  btn.querySelector(".btn-text").textContent = on ? "Loading…" : "Extract";
}

function hideResult() {
  document.getElementById("result-card").classList.add("hidden");
}

function showResult({ username, caption, profileUrl }) {
  document.getElementById("avatar-initials").textContent = getInitials(username);
  document.getElementById("author-name").textContent = "@" + username;
  const link = document.getElementById("author-link");
  link.href = profileUrl || ("https://instagram.com/" + username);
  document.getElementById("caption-text").textContent = caption;
  document.getElementById("char-count").textContent = caption.length + " characters";
  document.getElementById("result-card").classList.remove("hidden");
}

async function extractCaption() {
  clearError();
  hideResult();

  const raw = document.getElementById("reel-url").value.trim();

  if (!raw) { showError("Please paste an Instagram Reel URL first."); return; }
  if (!URL_PATTERN.test(raw)) { showError("That doesn't look like a valid Instagram Reel link."); return; }

  const shortcode = getShortcode(raw);
  if (!shortcode) { showError("Could not read the reel ID from that URL."); return; }

  setLoading(true);

  try {
    const res = await fetch(`/api/caption?shortcode=${encodeURIComponent(shortcode)}`);
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Failed to fetch caption.");
      return;
    }

    showResult(data);
  } catch (err) {
    showError("Network error — make sure the server is running (node server.js).");
  } finally {
    setLoading(false);
  }
}

async function copyCaption() {
  const text = document.getElementById("caption-text").textContent;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  const confirmEl = document.getElementById("copy-confirm");
  confirmEl.classList.remove("hidden");
  setTimeout(() => confirmEl.classList.add("hidden"), 2200);
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("reel-url");
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") extractCaption(); });
  input.addEventListener("paste", () => {
    setTimeout(() => { if (URL_PATTERN.test(input.value.trim())) extractCaption(); }, 60);
  });
});
