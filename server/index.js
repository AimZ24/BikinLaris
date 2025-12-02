require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Serve generated uploads (backgrounds, composites)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize OpenAI Images client (for DALL·E) if key provided
const openaiImageClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Initialize Kolosal AI client
const kolosalClient = new OpenAI({
  apiKey: process.env.KOLOSAL_API_KEY,
  baseURL: 'https://api.kolosal.ai/v1'
});

// Helper: Convert slug
function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper: Call Kolosal AI API
async function callKolosalAI(prompt) {
  try {
    const completion = await kolosalClient.chat.completions.create({
      model: 'Qwen 3 30BA3B',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Kolosal API error:', error);
    throw error;
  }
}

// Endpoint: Process product image & generate AI outputs
app.post('/api/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    const { productName, price, whatsapp } = req.body;

    if (!productName || !price || !whatsapp) {
      fs.unlink(imagePath, () => {});
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create comprehensive prompt (text-only)
    const prompt = `Generate professional marketing content for an Indonesian UMKM product.

Product Details:
- Name: "${productName}"
- Price: IDR ${price}

IMPORTANT: Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO extra text. Output must be valid JSON.

{
  "description": "A compelling 2-3 sentence product description that sells benefits and appeals to Indonesian buyers",
  "caption": "An Instagram caption (max 150 chars) with relevant emoji and CTA, written in Indonesian or English",
  "seo": "5-7 relevant SEO keywords separated by commas",
  "posterHeadline": "A catchy single-line headline (max 40 chars)",
  "posterSub": "A compelling sub-headline (max 50 chars)",
  "hashtags": "10 relevant hashtags for Instagram starting with #"
}`;

    const responseText = await callKolosalAI(prompt);
    
    // Parse JSON from response - handle markdown code blocks
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      const match = jsonText.match(/```json\n?([\s\S]*?)\n?```/);
      if (match) jsonText = match[1];
    }
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```\n?([\s\S]*?)\n?```/);
      if (match) jsonText = match[1];
    }

    jsonText = jsonText.trim();
    const result = JSON.parse(jsonText);

    // Cleanup uploaded file
    fs.unlink(imagePath, () => {});

    res.json(result);
  } catch (error) {
    console.error('Error processing image:', error);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      error: 'Failed to process image',
      details: error.message
    });
  }
});

// Endpoint: Generate microsite data
app.post('/api/microsite', async (req, res) => {
  try {
    const { productName, price, whatsapp } = req.body;

    if (!productName || !price || !whatsapp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `Create professional website copy for an UMKM microsite. Product: "${productName}", Price: "IDR ${price}", WhatsApp: "${whatsapp}".

IMPORTANT: Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO extra text.

{
  "headline": "Compelling main headline (max 60 chars)",
  "subheadline": "Supporting subheadline (max 100 chars)",
  "description": "Detailed product description (2-3 sentences)",
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "cta": "Call-to-action button text",
  "testimonial": "Sample customer testimonial"
}`;

    const responseText = await callKolosalAI(prompt);
    
    // Parse JSON from response
    let jsonText = responseText.trim();
    
    if (jsonText.includes('```json')) {
      const match = jsonText.match(/```json\n?([\s\S]*?)\n?```/);
      if (match) jsonText = match[1];
    }
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```\n?([\s\S]*?)\n?```/);
      if (match) jsonText = match[1];
    }

    jsonText = jsonText.trim();
    const data = JSON.parse(jsonText);
    
    res.json({
      ...data,
      slug: toSlug(productName),
      price: `IDR ${price.toLocaleString('id-ID')}`
    });
  } catch (error) {
    console.error('Error generating microsite:', error);
    res.status(500).json({
      error: 'Failed to generate microsite',
      details: error.message
    });
  }
});

// Endpoint: Generate poster design specification using Kolosal AI
app.post('/api/poster-spec', async (req, res) => {
  try {
    const { productName, price, whatsapp } = req.body;
    if (!productName || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `You are a senior graphic designer who creates high-conversion social-media posters with a minimalist, luxury aesthetic suitable for Indonesian UMKM brands.

Return ONLY a single JSON object (no explanation, no markdown, no code fences). Keep values short and realistic for a social media poster. The JSON must include the following keys:
- layout: "image_top" | "image_center" | "image_left"
- background: color hex or linear-gradient string
- palette: { "primary":hex, "accent":hex, "neutral":hex }
- primaryColor, accentColor (hex)
- headline (short, punchy)
- subheadline (concise)
- priceText (e.g., "IDR 25.000")
- priceColor (hex)
- priceStyle: "badge" | "line"
- ctaText, ctaColor
- fonts: { "primary": "Font name", "secondary": "Font name" }
- headlineSize (px), subheadlineSize (px)
- imageEffect (one-line: e.g., "brighten:8,shadow:18")
- accessibilityNotes (brief guidance about contrast/readability)

Prefer minimalist layouts with generous whitespace, clear typography, and a refined color palette. Use modern, legible font pairings (e.g., "Playfair Display" + "Inter" for luxury/minimal). Prioritize contrast so headline and price remain readable over images (suggest overlay if needed). Keep JSON concise.

Example output:
{
  "layout":"image_top",
  "background":"linear-gradient(#fff,#f6f4ee)",
  "palette": { "primary":"#0b3d2e", "accent":"#ffd166", "neutral":"#f5efe7" },
  "primaryColor":"#0b3d2e",
  "accentColor":"#ffd166",
  "headline":"Elegant Kopi Lokal",
  "subheadline":"Kopi premium, rasa bold & lembut",
  "priceText":"IDR ${price}",
  "priceColor":"#ffd166",
  "priceStyle":"badge",
  "ctaText":"Pesan Sekarang",
  "ctaColor":"#0bb14b",
  "fonts": { "primary":"Playfair Display", "secondary":"Inter" },
  "headlineSize":56,
  "subheadlineSize":20,
  "imageEffect":"brighten:8,desaturate:5,shadow:16",
  "accessibilityNotes":"Use a 40% dark overlay behind headline for readability over busy images"
}

Generate the JSON for product: ${productName} and price IDR ${price}.`;

    const responseText = await callKolosalAI(prompt);

    // Sanitize and parse JSON
    let jsonText = responseText.trim();
    const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) jsonText = jsonMatch[1];
    // also remove any surrounding ``` or stray text
    jsonText = jsonText.replace(/```/g, '').trim();

    const spec = JSON.parse(jsonText);

    // Add fallbacks for missing fields
    spec.layout = spec.layout || 'image_top';
    spec.background = spec.background || '#ffffff';
    spec.primaryColor = spec.primaryColor || '#667eea';
    spec.headline = spec.headline || `${productName}`;
    spec.subheadline = spec.subheadline || '';
    spec.priceText = spec.priceText || `IDR ${price}`;
    spec.ctaText = spec.ctaText || 'Pesan Sekarang';

    res.json({ success: true, spec });
  } catch (error) {
    console.error('Error generating poster spec:', error);
    res.status(500).json({ error: 'Failed to generate poster spec', details: error.message });
  }
});

// Endpoint: Generate AI-styled background images (via OpenAI Images / DALL·E)
app.post('/api/generate-background', async (req, res) => {
  try {
    if (!openaiImageClient) return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });

    const { productName, palette = null, mood = 'luxury minimalist', variants = 3, size = 1024 } = req.body;
    if (!productName) return res.status(400).json({ error: 'Missing productName' });

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // Build image prompt
    const paletteHint = palette ? ` Use these colors as primary cues: ${Object.values(palette).join(', ')}.` : '';
    const basePrompt = `Create a ${mood} textured social-media poster background for the product "${productName}".${paletteHint} Keep it minimal, elegant, and not too busy so text remains readable. Output a photorealistic or high-quality texture suitable for overlaying product photography.`;

    const results = [];

    for (let i = 0; i < Math.max(1, Math.min(6, variants)); i++) {
      // Slightly vary prompt for diversity
      const variantPrompt = i === 0 ? basePrompt : `${basePrompt} Variant ${i + 1}: slightly different composition or texture.`;

      // Call OpenAI Images (DALL·E) generate
      const imageResp = await openaiImageClient.images.generate({
        model: 'gpt-image-1',
        prompt: variantPrompt,
        size: `${size}x${size}`
      });

      // Response should include base64 in data[0].b64_json
      const b64 = imageResp.data?.[0]?.b64_json;
      if (!b64) continue;

      const buffer = Buffer.from(b64, 'base64');
      const fileName = `${Date.now()}_bg_${i}.png`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      results.push({ id: `v${i+1}`, imageUrl: `/uploads/${fileName}` });
    }

    if (results.length === 0) return res.status(500).json({ error: 'Image generation failed' });

    res.json({ success: true, variants: results });
  } catch (error) {
    console.error('Error generating background:', error);
    res.status(500).json({ error: 'Failed to generate background', details: error.message });
  }
});

// Endpoint: Generate WA order link with formatted message
app.post('/api/wa-link', (req, res) => {
  try {
    const { productName, price, whatsapp, quantity = 1 } = req.body;

    if (!productName || !price || !whatsapp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Clean phone number (remove non-digits)
    const cleanPhone = whatsapp.replace(/\D/g, '');
    
    // Create formatted order message
    const message = `Halo! Saya ingin memesan:\n\n📦 *${productName}*\n💰 Harga: IDR ${price.toLocaleString('id-ID')}\n📊 Jumlah: ${quantity}\n\nBisa bantuan?`;

    // Create WhatsApp link
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      waLink,
      message,
      formattedPrice: `IDR ${price.toLocaleString('id-ID')}`
    });
  } catch (error) {
    console.error('Error generating WA link:', error);
    res.status(500).json({
      error: 'Failed to generate WhatsApp link',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 BikinLaris server running on http://localhost:${PORT}`));
