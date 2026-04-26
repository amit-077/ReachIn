chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GENERATE_MESSAGE") {
    // console.log(request);
    generateMessage(request.posts, request.about, request.name).then(
      sendResponse,
    );
    return true;
  }
});

async function generateMessage(posts, about, name) {
  // console.log(posts);
  // console.log(about);
  // console.log(name);

    // ✅ Read API key and summary from storage
  const { openaiApiKey, userSummary } = await chrome.storage.local.get([
    "openaiApiKey",
    "userSummary",
  ]);

    const SENDER_BACKGROUND = userSummary || "";

    if (!openaiApiKey) {
    return { message: "⚠️ No API key found. Please set it in the extension popup." };
  }

const prompt = `Write a LinkedIn connection request under 280 characters.

Sender background: ${SENDER_BACKGROUND}
Recipient name: ${name}
Recipient about: ${about}
Recipient posts: ${posts}

Rules:
- Output ONLY the message, nothing else
- STRICTLY under 280 characters, count carefully
- Start with "Hi ${name}," or "Hey ${name},"
- Tone must be a bit formal and professional, but don't get too formal. Keep it subtle.
- Mention a shared domain or interest at a high level — do not go into specific project names or technical details
- Find a natural overlap between sender and recipient's background — same field, same type of work, or same technologies at a surface level
- Try to use a common connection between both, and then write a personalized message.
- You can use phrases like "would like to connect", "would love to discuss", "keen to exchange thoughts" if needed
- Never use the character '—' anywhere in the message
- Never use words: admire, inspiring, journey, insights, passionate, thrilled, excited, impressive, amazing, enhance, fluency
- No generic praise like "great work" or "commitment to learning"
- No emojis
- Output only the message, no explanation, no quotes`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // fast + cheap
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await res.json();

    // console.log("OpenAI response:", JSON.stringify(data, null, 2));

    const message =
      data?.choices?.[0]?.message?.content ||
      data?.error?.message ||
      "Could not generate message.";

    return { message };
  } catch (err) {
    console.error(err);
    return { message: "Error generating message." };
  }
}
