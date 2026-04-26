// console.log("🚀 AI Connect script loaded");

// ==========================
// 🧠 Cache posts
// ==========================
let cachedPosts = [];
let aboutSection;
let personName;

function extractAndCachePosts() {
  try {
    const containers = document.querySelectorAll(
      '[data-testid="carousel-children-container"]',
    );
    const container = containers[1] || containers[0];

    if (!container) return; // ✅ Don't overwrite cache if container not found

    const results = Array.from(
      container.querySelectorAll('[data-testid="carousel-child-container"]'),
    )
      .slice(0, 3)
      .map((li) => {
        const span = li.querySelector('[data-testid="expandable-text-box"]');
        if (!span) return null;
        const clone = span.cloneNode(true);
        clone.querySelectorAll("a").forEach((a) => a.remove());
        return clone.textContent.split("… more")[0].trim();
      })
      .filter(Boolean);

    if (results.length > 0) {
      cachedPosts = results; // ✅ Only overwrite if we actually found posts
      // console.log("✅ Posts cached:", cachedPosts);
    }

    aboutSection =
      document.querySelectorAll('[data-testid="expandable-text-box"]')[0]
        .textContent || "";
    personName =
      document.querySelectorAll("h2")[1].textContent ||
      document.querySelectorAll("h1")[1].textContent;
  } catch (err) {
    console.error("❌ extractAndCachePosts error:", err);
  }
}

// ==========================
// 🔍 Deep Query — for shadow DOM elements only
// ==========================
function deepQuery(selector, root = document) {
  const found = root.querySelector(selector);
  if (found) return found;

  for (const el of root.querySelectorAll("*")) {
    if (el.shadowRoot) {
      const result = deepQuery(selector, el.shadowRoot);
      if (result) return result;
    }
  }
  return null;
}

// ==========================
// 🔍 Observe shadow roots
// ==========================
function observeAllShadowRoots(root = document) {
  for (const el of root.querySelectorAll("*")) {
    if (el.shadowRoot && !el.__aiObserved) {
      el.__aiObserved = true;
      shadowObserver.observe(el.shadowRoot, { childList: true, subtree: true });
      observeAllShadowRoots(el.shadowRoot);
    }
  }
}

// ==========================
// 🔔 Show inline toast modal
// ==========================
function showToast(message, type = "error") {
  const existing = document.getElementById("ai-connect-toast");
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = "ai-connect-style";
  if (!document.getElementById("ai-connect-style")) {
    style.textContent = `
      @keyframes aiFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes aiFadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(10px); }
      }
    `;
    document.head.appendChild(style);
  }

  const toast = document.createElement("div");
  toast.id = "ai-connect-toast";

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    background: type === "error" ? "#ff4d4f" : "#0a66c2",
    color: "white",
    padding: "12px 20px",
    borderRadius: "10px",
    fontFamily: "sans-serif",
    fontSize: "14px",
    fontWeight: "500",
    zIndex: "999999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    maxWidth: "300px",
    animation: "aiFadeIn 0.2s ease",
  });

  const icon = type === "error" ? "❌" : "✅";
  toast.innerHTML = `
    <span>${icon}</span>
    <span>${message}</span>
    <button onclick="document.getElementById('ai-connect-toast').remove()" style="
      margin-left: auto;
      background: transparent;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    ">×</button>
  `;

  document.body.appendChild(toast);

  // Auto dismiss after 4s
  setTimeout(() => {
    const t = document.getElementById("ai-connect-toast");
    if (t) {
      t.style.animation = "aiFadeOut 0.3s ease forwards";
      setTimeout(() => t?.remove(), 300);
    }
  }, 4000);
}

// ==========================
// ⏳ Spinner helpers
// ==========================
function showSpinner(btn) {
  btn.disabled = true;
  btn.style.background = "#0a66c2"; // ✅ fill background so white spinner is visible
  btn.style.color = "white";

  btn.innerHTML = `
    <span id="ai-spinner" style="
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white;
      border-radius: 50%;
      vertical-align: middle;
    "></span>
  `;

  // ✅ Spin via JS interval instead of CSS animation (works in content scripts)
  let angle = 0;
  const spinner = btn.querySelector("#ai-spinner");
  btn._spinInterval = setInterval(() => {
    angle += 10;
    if (spinner) spinner.style.transform = `rotate(${angle}deg)`;
  }, 20);
}

function hideSpinner(btn) {
  // ✅ Clear the JS interval
  if (btn._spinInterval) {
    clearInterval(btn._spinInterval);
    btn._spinInterval = null;
  }

  btn.disabled = false;

  // ✅ Restore outlined style
  btn.style.background = "transparent";
  btn.style.color = "#0a66c2";

  btn.innerHTML = btn.dataset.used === "true" ? "↺ Rewrite" : "✨ ReachIn";
}

// ==========================
// 🔘 Create Button
// ==========================
function createButton() {
  const btn = document.createElement("button");
  btn.id = "ai-connect-btn";
  btn.innerText = "ReachIn";
  btn.dataset.used = "false"; // ✅ track if used

  Object.assign(btn.style, {
    marginLeft: "8px",
    padding: "6px 14px",
    background: "transparent", // ✅ no fill
    color: "#0a66c2",
    border: "1.5px solid #0a66c2", // ✅ outlined
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px",
    zIndex: 9999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "110px",
    height: "32px",
    transition: "all 0.2s",
  });

  // Hover effect
  btn.addEventListener("mouseenter", () => {
    if (!btn.disabled) {
      btn.style.background = "#1b74cdff";
      btn.style.color = "#f5f5f5";
    }
  });

  btn.addEventListener("mouseleave", () => {
    if (!btn.disabled) {
      btn.style.background = "transparent";
      btn.style.color = "#0a66c2";
    }
  });

  btn.onclick = async () => {
    if (cachedPosts.length === 0) {
      showToast(
        "No posts found for this user. Cannot generate message.",
        "error",
      );
      return;
    }

    showSpinner(btn);

    try {
      const response = await Promise.race([
        chrome.runtime.sendMessage({
          type: "GENERATE_MESSAGE",
          posts: cachedPosts,
          name: personName,
          about: aboutSection,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 10000),
        ),
      ]);

      hideSpinner(btn);

      // console.log("response =>", response);

      if (response?.message) {
        fillTextarea(response.message);
        // showToast("✅ Message generated!", "success");

        // ✅ Change to Rewrite after first use
        btn.dataset.used = "true";
        btn.innerText = "↺ Rewrite";
      }
    } catch (err) {
      // console.log("ERROR HERE!");
      // console.log(err);
      hideSpinner(btn);

      if (err.message === "timeout") {
        showToast("Request timed out. Please try again.", "error");
      } else {
        showToast("An error occurred. Please try again.", "error");
      }
    }
  };

  return btn;
}

// ==========================
// 📌 Insert Button
// ==========================
function insertButton() {
  if (deepQuery("#ai-connect-btn")) return;

  const sendBtn = deepQuery('button[aria-label="Send invitation"]');
  if (!sendBtn) return;

  // console.log("🎯 Found Send invitation button, inserting...");
  const btn = createButton();
  sendBtn.parentNode.insertBefore(btn, sendBtn.nextSibling);
  // console.log("✅ AI button inserted!");
}

function fillTextarea(message) {
  const textarea = deepQuery("#custom-message");
  if (!textarea) {
    // console.log("❌ Textarea not found");
    showToast("Could not find message box. Please paste manually.", "error");
    return;
  }

  // ✅ Focus and fill — React/Ember friendly
  textarea.focus();
  textarea.value = message;

  // ✅ Trigger input + change events so LinkedIn's framework picks up the value
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));

  // console.log("✅ Textarea filled!");
}

// ==========================
// 🔁 Throttled insert
// ==========================
let insertScheduled = false;

function scheduleInsert() {
  if (insertScheduled) return;
  insertScheduled = true;
  requestAnimationFrame(() => {
    insertScheduled = false;
    extractAndCachePosts();
    insertButton();
    observeAllShadowRoots();
  });
}

// ==========================
// 👁 Observer
// ==========================
const shadowObserver = new MutationObserver(scheduleInsert);

shadowObserver.observe(document.body, { childList: true, subtree: true });
observeAllShadowRoots();

extractAndCachePosts();

// console.log("⚡ Immediate attempt...");
insertButton();
