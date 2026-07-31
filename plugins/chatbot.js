const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");
const fromMe = config.MODE !== "public";
const { setVar } = require("./manage");
const fs = require("fs");

const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";

const models = [
  "llama-3.3-70b-versatile",
  "deepseek-r1-distill-llama-70b",
  "qwen-2.5-32b",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

const visionModels = [
  "llama-3.2-90b-vision-preview",
  "llama-3.2-11b-vision-preview",
];

const chatbotStates = new Map();
const chatContexts = new Map();
const modelStates = new Map();

let globalSystemPrompt =
  "You are Victory Hub, a powerful AI assistant created by KING DEV. You are smart, fast, and reliable. Respond concisely and professionally in the user's language.";

async function initChatbotData() {
  try {
    const chatbotData = config.CHATBOT || "";
    if (chatbotData) {
      const enabledChats = chatbotData.split(",").filter((jid) => jid.trim());
      enabledChats.forEach((jid) => {
        chatbotStates.set(jid.trim(), true);
        modelStates.set(jid.trim(), 0);
      });
    }

    const systemPrompt = config.CHATBOT_SYSTEM_PROMPT;
    if (systemPrompt) {
      globalSystemPrompt = systemPrompt;
    }
  } catch (error) {
    console.error("Error initializing chatbot data:", error);
  }
}

async function saveChatbotData() {
  try {
    const enabledChats = [];
    for (const [jid, enabled] of chatbotStates.entries()) {
      if (enabled) {
        enabledChats.push(jid);
      }
    }
    await setVar("CHATBOT", enabledChats.join(","));
  } catch (error) {
    console.error("Error saving chatbot data:", error);
  }
}

async function saveSystemPrompt(prompt) {
  try {
    globalSystemPrompt = prompt;
    await setVar("CHATBOT_SYSTEM_PROMPT", prompt);
  } catch (error) {
    console.error("Error saving system prompt:", error);
  }
}

function imageToBase64(imageBuffer) {
  return imageBuffer.toString("base64");
}

async function getGroqResponse(message, chatJid, imageBuffer = null) {
  const apiKey = config.GROQ_API_KEY;
  if (!apiKey) {
    return "_❌ GROQ_API_KEY not configured. Please set it using `.setvar GROQ_API_KEY your_api_key`_\n\n_Get a free key at: https://console.groq.com/keys_";
  }

  const currentModelIndex = modelStates.get(chatJid) || 0;
  let currentModel;

  if (imageBuffer) {
    currentModel = visionModels[0];
  } else {
    currentModel = config.GROQ_MODEL || models[currentModelIndex];
  }

  try {
    const context = chatContexts.get(chatJid) || [];

    const messages = [
      {
        role: "system",
        content: globalSystemPrompt,
      },
    ];

    const recentContext = context.slice(-10);
    recentContext.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    if (imageBuffer) {
      const base64Image = imageToBase64(imageBuffer);
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: message || "What do you see in this image? Describe it in detail.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: message,
      });
    }

    const payload = {
      model: currentModel,
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
    };

    const response = await axios.post(GROQ_API_BASE, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    if (
      response.data &&
      response.data.choices &&
      response.data.choices.length > 0
    ) {
      const aiResponse = response.data.choices[0].message.content;

      if (!chatContexts.has(chatJid)) {
        chatContexts.set(chatJid, []);
      }
      const contextArray = chatContexts.get(chatJid);
      const contextMessage = imageBuffer
        ? `${message || "[Image analysis]"}`
        : message;
      contextArray.push({ role: "user", content: contextMessage });
      contextArray.push({ role: "assistant", content: aiResponse });

      if (contextArray.length > 20) {
        contextArray.splice(0, contextArray.length - 20);
      }

      return aiResponse;
    } else {
      return "_❌ Received unexpected response from Groq AI. Please try again._";
    }
  } catch (error) {
    console.error("Error getting Groq response:", error.message);

    if (error.response && error.response.status === 429) {
      const nextModelIndex = currentModelIndex + 1;
      if (nextModelIndex < models.length) {
        modelStates.set(chatJid, nextModelIndex);
        console.log(
          `Switching to model: ${models[nextModelIndex]} for chat: ${chatJid}`
        );
        return "_⚠️ Rate limit reached. Switched to backup model. Please try again._";
      } else {
        return "_❌ All models have reached their rate limits. Please try again later._";
      }
    }

    if (error.response) {
      return `_❌ Groq API Error: ${
        error.response.data?.error?.message || "Unknown error"
      }_`;
    }

    return "_❌ Network error. Please check your connection and try again._";
  }
}

function isChatbotEnabled(jid) {
  if (chatbotStates.get(jid) === true) {
    return true;
  }

  const isGroup = jid.includes("@g.us");
  if (isGroup && config.CHATBOT_ALL_GROUPS === "true") {
    return true;
  }

  if (!isGroup && config.CHATBOT_ALL_DMS === "true") {
    return true;
  }

  return false;
}

async function enableChatbot(jid) {
  chatbotStates.set(jid, true);
  if (!modelStates.has(jid)) {
    modelStates.set(jid, 0);
  }
  await saveChatbotData();
}

async function disableChatbot(jid) {
  chatbotStates.set(jid, false);
  chatContexts.delete(jid);
  await saveChatbotData();
}

function clearContext(jid) {
  chatContexts.delete(jid);
}

async function clearAllContexts(target) {
  if (target === "groups") {
    for (const [jid] of chatbotStates.entries()) {
      if (jid.includes("@g.us")) {
        clearContext(jid);
      }
    }
  } else if (target === "dms") {
    for (const [jid] of chatbotStates.entries()) {
      if (!jid.includes("@g.us")) {
        clearContext(jid);
      }
    }
  }
}

initChatbotData();

Module(
  {
    pattern: "chatbot ?(.*)",
    fromMe: true,
    desc: "Victory Hub AI Chatbot powered by Groq - supports text and image analysis",
    usage:
      '.chatbot - _Show help menu_\n.chatbot on/off - _Enable/disable in current chat_\n.chatbot on/off groups - _Enable/disable in all groups_\n.chatbot on/off dms - _Enable/disable in all DMs_\n.chatbot set "prompt" - _Set system prompt_\n.chatbot clear - _Clear conversation context_',
  },
  async (message, match) => {
    const input = match[1]?.trim();
    const chatJid = message.jid;

    if (!input) {
      const isEnabled = isChatbotEnabled(chatJid);
      const globalGroups = config.CHATBOT_ALL_GROUPS === "true";
      const globalDMs = config.CHATBOT_ALL_DMS === "true";
      const currentModel = models[modelStates.get(chatJid) || 0];
      const contextSize = chatContexts.get(chatJid)?.length || 0;
      const hasApiKey = !!config.GROQ_API_KEY;

      const helpText =
        `*_🤖 Victory Hub AI - Groq Powered_*\n\n` +
        `📊 _Status:_ \`${isEnabled ? "Enabled" : "Disabled"}\`\n` +
        `🔑 _Groq API Key:_ \`${hasApiKey ? "Configured ✅" : "Missing ❌"}\`\n` +
        `⚡ _Engine:_ \`Groq (Fastest Inference)\`\n` +
        `🌐 _Global Groups:_ \`${
          globalGroups ? "Enabled ✅" : "Disabled ❌"
        }\`\n` +
        `💬 _Global DMs:_ \`${globalDMs ? "Enabled ✅" : "Disabled ❌"}\`\n` +
        `🤖 _Model:_ \`${currentModel}\`\n` +
        `👁️ _Vision:_ \`${visionModels[0]}\`\n` +
        `💭 _Context:_ \`${contextSize} msgs\`\n\n` +
        (hasApiKey
          ? `*_Commands:_*\n` +
            `- \`.chatbot on\` - _Enable in this chat_\n` +
            `- \`.chatbot off\` - _Disable in this chat_\n` +
            `- \`.chatbot on groups\` - _Enable all groups_\n` +
            `- \`.chatbot on dms\` - _Enable all DMs_\n` +
            `- \`.chatbot set "prompt"\` - _Custom AI personality_\n` +
            `- \`.chatbot clear\` - _Clear context_\n\n` +
            `*_How to use:_*\n` +
            `- _DM the bot to chat_\n` +
            `- _@mention in groups_\n` +
            `- _Reply to images for AI vision analysis_`
          : `*_⚠️ Setup Required:_*\n` +
            `_Get free Groq API key:_\n` +
            `- _Visit: https://console.groq.com/keys_\n` +
            `- _Sign up (free)_\n` +
            `- _Create API Key_\n\n` +
            `*_Set key:_*\n` +
            `\`.setvar GROQ_API_KEY=your_key_here\``);

      return await message.sendReply(helpText);
    }

    const args = input.split(" ");
    const command = args[0].toLowerCase();
    const target = args[1]?.toLowerCase();

    switch (command) {
      case "on":
        if (!config.GROQ_API_KEY) {
          return await message.sendReply(
            `*_❌ GROQ_API_KEY Not Configured_*\n\n` +
              `_Get free key: https://console.groq.com/keys_\n` +
              `_Set with: \`.setvar GROQ_API_KEY=your_key\`_`
          );
        }

        if (target === "groups") {
          await setVar("CHATBOT_ALL_GROUPS", "true");
          return await message.sendReply(
            `*_🤖 Victory Hub AI Enabled for All Groups_*\n\n` +
              `✅ _Responding to mentions & replies_\n` +
              `⚡ _Engine: Groq_\n` +
              `🤖 _Model: \`${models[0]}\``
          );
        } else if (target === "dms") {
          await setVar("CHATBOT_ALL_DMS", "true");
          return await message.sendReply(
            `*_🤖 Victory Hub AI Enabled for All DMs_*\n\n` +
              `✅ _Responding to all messages_\n` +
              `⚡ _Engine: Groq_`
          );
        } else {
          await enableChatbot(chatJid);
          return await message.sendReply(
            `*_🤖 Victory Hub AI Enabled_*\n\n` +
              `⚡ _Engine: Groq_\n` +
              `🤖 _Model: \`${models[0]}\`\n` +
              `👁️ _Vision: \`${visionModels[0]}\`\n\n` +
              `_I'll respond to DMs, mentions, and replies!_`
          );
        }

      case "off":
        if (target === "groups") {
          await setVar("CHATBOT_ALL_GROUPS", "false");
          return await message.sendReply(
            "*_🤖 AI Disabled for All Groups_* ❌"
          );
        } else if (target === "dms") {
          await setVar("CHATBOT_ALL_DMS", "false");
          return await message.sendReply(
            "*_🤖 AI Disabled for All DMs_* ❌"
          );
        } else {
          await disableChatbot(chatJid);
          return await message.sendReply(
            "*_🤖 AI Disabled_*\n\n_Context cleared._"
          );
        }

      case "set":
        const promptMatch = input.match(/set\s+"([^"]+)"/);
        if (!promptMatch) {
          return await message.sendReply(
            '_Use: .chatbot set "Your custom AI personality"_'
          );
        }
        await saveSystemPrompt(promptMatch[1]);
        return await message.sendReply(
          `*_🎯 AI Personality Updated_*\n\n📝 _"${promptMatch[1].substring(0, 200)}..."_`
        );

      case "clear":
        if (target === "groups" || target === "dms") {
          await clearAllContexts(target);
          return await message.sendReply(
            `*_💭 All ${target} contexts cleared_*`
          );
        }
        clearContext(chatJid);
        return await message.sendReply("*_💭 Context Cleared_*");

      case "status":
        const isEnabled = isChatbotEnabled(chatJid);
        const currentModel = models[modelStates.get(chatJid) || 0];
        const contextSize = chatContexts.get(chatJid)?.length || 0;

        return await message.sendReply(
          `*_🤖 Victory Hub AI Status_*\n\n` +
            `📊 _Status:_ \`${isEnabled ? "✅ Active" : "❌ Inactive"}\`\n` +
            `⚡ _Engine:_ \`Groq LPU\`\n` +
            `🤖 _Model:_ \`${currentModel}\`\n` +
            `👁️ _Vision:_ \`${visionModels[0]}\`\n` +
            `💭 _Context:_ \`${contextSize} msgs\`\n` +
            `🔑 _API Key:_ \`${
              config.GROQ_API_KEY ? "Set ✅" : "Missing ❌"
            }\`\n\n` +
            `*_Available Models:_*\n` +
            models.map((m, i) => `  ${i + 1}. \`${m}\``).join("\n") +
            `\n\n*_Vision Models:_*\n` +
            visionModels.map((m) => `  • \`${m}\``).join("\n")
        );

      default:
        return await message.sendReply(
          `_Unknown: \`${command}\`_\n\n_Use \`.chatbot\` for help._`
        );
    }
  }
);

Module(
  {
    on: "text",
    fromMe: false,
  },
  async (message) => {
    try {
      const chatJid = message.jid;
      const isGroup = message.isGroup;
      const isDM = !isGroup;

      if (!isChatbotEnabled(chatJid)) return;
      if (message.fromMe) return;
      if (!config.GROQ_API_KEY) return;

      let shouldRespond = false;
      const messageText = message.text;

      if (isDM) {
        shouldRespond = true;
      } else if (isGroup) {
        const botJid = message.client.user?.lid;

        if (message.mention && message.mention.length > 0) {
          const botMentioned = message.mention.some((jid) => {
            const mentionedNum = jid.split("@")[0];
            const botNum = botJid?.split(":")[0];
            return mentionedNum === botNum;
          });
          if (botMentioned) shouldRespond = true;
        }

        if (message.reply_message && message.reply_message.jid) {
          const repliedToNum = message.reply_message.jid.split("@")[0];
          const botNum = botJid?.split(":")[0];
          if (repliedToNum === botNum) shouldRespond = true;
        }
      }

      if (!shouldRespond) return;

      let imageBuffer = null;
      let responseText = messageText;

      if (message.reply_message && message.reply_message.image) {
        try {
          imageBuffer = await message.reply_message.download("buffer");
          if (!messageText || messageText.length < 2) {
            responseText = "What do you see in this image?";
          }
        } catch (error) {
          console.error("Error downloading image:", error);
          return await message.sendReply(
            "_❌ Failed to download image._"
          );
        }
      } else if (messageText.length < 2) {
        return;
      }

      let commandPrefixes = [];
      if (config.HANDLERS === "false") {
        commandPrefixes = [];
      } else {
        const handlers = config.HANDLERS || ".,";
        if (typeof handlers === "string") {
          commandPrefixes = handlers.split("").filter((char) => char.trim());
        }
      }

      if (
        commandPrefixes.length > 0 &&
        commandPrefixes.some((prefix) => responseText.startsWith(prefix))
      ) {
        return;
      }

      const aiResponse = await getGroqResponse(
        responseText,
        chatJid,
        imageBuffer
      );

      if (aiResponse) {
        await message.sendReply(aiResponse);
      }
    } catch (error) {
      console.error("Error in message handler:", error);
    }
  }
);

Module(
  {
    pattern: "ai ?(.*)",
    fromMe,
    desc: "Ask Victory Hub AI (Groq) with text and/or image input",
    type: "ai",
  },
  async (message, match) => {
    let imageBuffer = null;
    let prompt = match[1]?.trim() || "";

    if (message.reply_message) {
      if (message.reply_message.image) {
        try {
          imageBuffer = await message.reply_message.download("buffer");
        } catch (error) {
          console.error("Error downloading image:", error);
          return await message.sendReply("❌ Failed to download the image.");
        }
        if (!prompt) prompt = "What do you see in this image?";
      } else if (message.reply_message.text && !prompt) {
        prompt = message.reply_message.text;
      }
    }

    if (!prompt && !imageBuffer) {
      return await message.sendReply(
        "_Please provide a prompt or reply to a message/image._"
      );
    }

    try {
      const sent_msg = await message.sendReply("_⚡ Thinking with Groq..._");
      const response = await getGroqResponse(prompt, message.jid, imageBuffer);

      if (response) {
        await message.edit(response, message.jid, sent_msg.key);
      } else {
        await message.edit("❌ Empty response from AI.", message.jid, sent_msg.key);
      }
    } catch (error) {
      console.error("AI command error:", error.message);
      await message.sendReply("❌ An error occurred with Groq AI.");
    }
  }
);