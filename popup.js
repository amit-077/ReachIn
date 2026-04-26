const summaryEl = document.getElementById("summary");
const apiKeyEl = document.getElementById("apiKey");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const toast = document.getElementById("toast");
const savedBadge = document.getElementById("savedBadge");

// ==========================
// Load saved values on open
// ==========================
chrome.storage.local.get(["userSummary", "openaiApiKey"], (data) => {
  if (data.userSummary) summaryEl.value = data.userSummary;
  if (data.openaiApiKey) apiKeyEl.value = data.openaiApiKey;

  if (data.userSummary || data.openaiApiKey) {
    savedBadge.classList.add("show");
  }
});

// ==========================
// Save
// ==========================
saveBtn.addEventListener("click", () => {
  const summary = summaryEl.value.trim();
  const apiKey = apiKeyEl.value.trim();

  if (!summary) {
    showToast("Please enter your summary.", "error");
    summaryEl.focus();
    return;
  }

  if (!apiKey || !apiKey.startsWith("sk-")) {
    showToast("Please enter a valid OpenAI API key.", "error");
    apiKeyEl.focus();
    return;
  }

  chrome.storage.local.set(
    { userSummary: summary, openaiApiKey: apiKey },
    () => {
      showToast("✓ Settings saved!", "success");
      savedBadge.classList.add("show");
    },
  );
});

// ==========================
// Cancel — revert to saved
// ==========================
cancelBtn.addEventListener("click", () => {
  chrome.storage.local.get(["userSummary", "openaiApiKey"], (data) => {
    summaryEl.value = data.userSummary || "";
    apiKeyEl.value = data.openaiApiKey || "";
  });

  showToast("Changes discarded.", "error");
});

// ==========================
// Toast helper
// ==========================
function showToast(message, type) {
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}
