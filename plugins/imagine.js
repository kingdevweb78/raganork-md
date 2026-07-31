const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const fromMe = config.MODE !== "public";

const IMAGINE_API = "https://image.pollinations.ai/prompt";

Module(
  {
    pattern: "imagine ?(.*)",
    fromMe,
    desc: "Generate AI images using Pollinations.ai (FREE). Use .imagine <prompt> to create stunning images.",
    usage:
      ".imagine <prompt> - _Generate an image_\n.imagine <prompt> --size 1024x1024 - _Custom size_\n.imagine <prompt> --model flux - _Use Flux model_\n.imagine <prompt> --anime - _Anime style_\n.imagine help - _Show style guide_",
    type: "ai",
  },
  async (message, match) => {
    const input = match[1]?.trim();

    if (!input || input === "help") {
      return await message.sendReply(
        `*_🎨 Victory Hub Image Generator_*\n\n` +
          `*Basic Usage:*\n` +
          `\`.imagine a futuristic city at night\`\n\n` +
          `*Options:*\n` +
          `\`.imagine <prompt> --size 512x512\`\n` +
          `\`.imagine <prompt> --size 1024x1024\`\n` +
          `\`.imagine <prompt> --model flux\`\n` +
          `\`.imagine <prompt> --anime\`\n` +
          `\`.imagine <prompt> --realistic\`\n` +
          `\`.imagine <prompt> --3d\`\n` +
          `\`.imagine <prompt> --logo\`\n\n` +
          `*Style Presets:*\n` +
          `• \`--anime\` - _Anime/manga style_\n` +
          `• \`--realistic\` - _Photorealistic_\n` +
          `• \`--3d\` - _3D render style_\n` +
          `• \`--logo\` - _Logo design style_\n` +
          `• \`--cyberpunk\` - _Cyberpunk aesthetic_\n\n` +
          `*Tips:*\n` +
          `_Be descriptive - more details = better results_\n` +
          `_Generation takes 10-30 seconds_\n` +
          `_Powered by Pollinations.ai (FREE)_`
      );
    }

    let prompt = input;
    let width = 1024;
    let height = 1024;
    let model = "flux";
    let seed = Math.floor(Math.random() * 1000000);

    const stylePresets = {
      "--anime": ", anime style, studio ghibli aesthetic, vibrant colors, detailed illustration",
      "--realistic": ", photorealistic, 8k, highly detailed, professional photography",
      "--3d": ", 3D render, octane render, unreal engine 5, cinematic lighting",
      "--logo": ", minimalist logo design, vector style, clean, professional, flat design",
      "--cyberpunk": ", cyberpunk, neon lights, futuristic, blade runner aesthetic, rain, night",
      "--fantasy": ", fantasy art, magic, epic, digital painting, concept art",
      "--pixel": ", pixel art, 16-bit, retro game style",
      "--watercolor": ", watercolor painting, artistic, soft colors, hand-drawn",
      "--sketch": ", pencil sketch, black and white, detailed drawing",
    };

    for (const [flag, stylePrompt] of Object.entries(stylePresets)) {
      if (prompt.includes(flag)) {
        prompt = prompt.replace(flag, "").trim();
        prompt += stylePrompt;
      }
    }

    const sizeMatch = prompt.match(/--size\s+(\d+)x(\d+)/);
    if (sizeMatch) {
      width = parseInt(sizeMatch[1]);
      height = parseInt(sizeMatch[2]);
      prompt = prompt.replace(/--size\s+\d+x\d+/, "").trim();

      if (width > 2048) width = 2048;
      if (height > 2048) height = 2048;
      if (width < 256) width = 256;
      if (height < 256) height = 256;
    }

    const modelMatch = prompt.match(/--model\s+(\S+)/);
    if (modelMatch) {
      model = modelMatch[1];
      prompt = prompt.replace(/--model\s+\S+/, "").trim();
    }

    const seedMatch = prompt.match(/--seed\s+(\d+)/);
    if (seedMatch) {
      seed = parseInt(seedMatch[1]);
      prompt = prompt.replace(/--seed\s+\d+/, "").trim();
    }

    if (!prompt || prompt.length < 3) {
      return await message.sendReply(
        "_Please provide a description for the image.\nExample: .imagine a beautiful sunset over mountains_"
      );
    }

    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `${IMAGINE_API}/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

      await message.sendReply(
        `*_🎨 Generating Image..._*\n\n` +
          `📝 _"${prompt.length > 100 ? prompt.substring(0, 100) + "..." : prompt}"_\n` +
          `📐 _${width}×${height}_\n` +
          `🎯 _Model: ${model}_\n` +
          `⚡ _Powered by Victory Hub AI_`
      );

      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
      });

      if (response.data) {
        const tempDir = path.join(__dirname, "..", "temp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const fileName = `imagine_${Date.now()}.png`;
        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, response.data);

        await message.client.sendMessage(message.jid, {
          image: fs.readFileSync(filePath),
          caption: `🎨 *Victory Hub AI*\n\n📝 _"${prompt.length > 150 ? prompt.substring(0, 150) + "..." : prompt}"_\n📐 ${width}×${height}\n🎯 ${model}\n\n⚡ _Generated by Victory Hub_`,
        });

        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.log("Failed to delete temp file:", filePath);
        }
      } else {
        await message.sendReply(
          "_❌ Failed to generate image. Please try a different prompt._"
        );
      }
    } catch (error) {
      console.error("Imagine error:", error.message);
      await message.sendReply(
        `_❌ Image generation failed: ${error.message}_\n\n_Try a shorter prompt or check your connection._`
      );
    }
  }
);

Module(
  {
    pattern: "img ?(.*)",
    fromMe,
    desc: "Quick image generation (alias for imagine)",
    type: "ai",
  },
  async (message, match) => {
    const prompt = match[1]?.trim();
    if (!prompt) {
      return await message.sendReply(
        "_Usage: .img <description>\nExample: .img a cute cat wearing sunglasses_"
      );
    }

    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `${IMAGINE_API}/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true`;

      await message.sendReply("_🎨 Generating quick image..._");

      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 45000,
      });

      if (response.data) {
        const tempDir = path.join(__dirname, "..", "temp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const filePath = path.join(tempDir, `img_${Date.now()}.png`);
        fs.writeFileSync(filePath, response.data);

        await message.client.sendMessage(message.jid, {
          image: fs.readFileSync(filePath),
          caption: `🎨 _"${prompt.length > 200 ? prompt.substring(0, 200) + "..." : prompt}"_\n\n⚡ Victory Hub`,
        });

        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
      }
    } catch (error) {
      console.error("Quick img error:", error.message);
      await message.sendReply("_❌ Quick generation failed. Try .imagine instead._");
    }
  }
);