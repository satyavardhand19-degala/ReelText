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

function showScreen(id) {
  const current = document.querySelector(".screen.active");
  const next = document.getElementById(id);
  if (current === next) return;

  if (current) {
    current.classList.add("exit-left");
    current.classList.remove("active");
    setTimeout(() => current.classList.remove("exit-left"), 420);
  }

  next.classList.add("enter-right");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      next.classList.add("active");
      next.classList.remove("enter-right");
    });
  });
}

function showError(msg) {
  const el = document.getElementById("error-msg");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError() {
  document.getElementById("error-msg").classList.add("hidden");
}

async function extractCaption() {
  clearError();

  const raw = document.getElementById("reel-url").value.trim();

  if (!raw) { showError("Please paste an Instagram Reel URL first."); return; }
  if (!URL_PATTERN.test(raw)) { showError("That doesn't look like a valid Instagram Reel link."); return; }

  const shortcode = getShortcode(raw);
  if (!shortcode) { showError("Could not read the reel ID from that URL."); return; }

  const btn = document.getElementById("extract-btn");
  btn.disabled = true;

  showScreen("screen-loading");

  try {
    const res = await fetch(`/api/caption?shortcode=${encodeURIComponent(shortcode)}`);
    const data = await res.json();

    if (!res.ok) {
      showScreen("screen-input");
      showError(data.error || "Failed to fetch caption.");
      btn.disabled = false;
      return;
    }

    document.getElementById("avatar-initials").textContent = getInitials(data.username);
    document.getElementById("author-name").textContent = "@" + data.username;
    const link = document.getElementById("author-link");
    link.href = data.profileUrl || ("https://instagram.com/" + data.username);
    document.getElementById("caption-text").textContent = data.caption;
    document.getElementById("char-count").textContent = data.caption.length + " characters";

    showScreen("screen-result");
  } catch (err) {
    showScreen("screen-input");
    showError("Network error — could not reach the server.");
  } finally {
    btn.disabled = false;
  }
}

function goBack() {
  document.getElementById("reel-url").value = "";
  clearError();
  document.getElementById("copy-confirm").classList.add("hidden");
  showScreen("screen-input");
  setTimeout(() => document.getElementById("reel-url").focus(), 420);
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
  input.focus();
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") extractCaption(); });
  input.addEventListener("paste", () => {
    setTimeout(() => { if (URL_PATTERN.test(input.value.trim())) extractCaption(); }, 60);
  });
});
