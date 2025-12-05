require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve generated uploads (backgrounds, composites)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize OpenAI Images client (for DALL·E) if key provided
// Initialize OpenAI Images client (REMOVED)
// const openaiImageClient = null;

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
    console.error('Kolosal AI Error:', error.message);
    throw error;
  }
}

// Endpoint: Calculate HPP and get AI pricing recommendation
app.post('/api/calculate-hpp', async (req, res) => {
  try {
    const { productName, bahanBaku, tenagaKerja, biayaLain } = req.body;

    if (!productName || bahanBaku === undefined || tenagaKerja === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hpp = parseFloat(bahanBaku) + parseFloat(tenagaKerja) + parseFloat(biayaLain || 0);

    // AI recommendation for optimal price
    const prompt = `Sebagai konsultan bisnis UMKM Indonesia, berikan rekomendasi harga jual optimal untuk produk berikut:

Nama Produk: ${productName}
HPP (Harga Pokok Produksi): IDR ${hpp.toLocaleString('id-ID')}

Analisis:
1. Harga kompetitor untuk produk serupa di Indonesia
2. Margin keuntungan yang wajar untuk UMKM (biasanya 30-50%)
3. Harga psikologis yang menarik untuk konsumen Indonesia

IMPORTANT: Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO extra text.

{
  "recommendedPrice": harga_jual_optimal_number,
  "minPrice": harga_minimum_number,
  "maxPrice": harga_maksimum_number,
  "profitMargin": persentase_margin_number,
  "reasoning": "Penjelasan singkat mengapa harga ini optimal (2-3 kalimat dalam Bahasa Indonesia)",
  "competitorRange": "Range harga kompetitor (contoh: IDR 15,000 - 25,000)"
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
    const aiRecommendation = JSON.parse(jsonText);

    res.json({
      hpp: {
        bahanBaku: parseFloat(bahanBaku),
        tenagaKerja: parseFloat(tenagaKerja),
        biayaLain: parseFloat(biayaLain || 0),
        total: hpp
      },
      recommendation: aiRecommendation,
      competitorData: {
        range: aiRecommendation.competitorRange || 'N/A'
      }
    });
  } catch (error) {
    console.error('Error calculating HPP:', error);
    res.status(500).json({
      error: 'Failed to calculate HPP',
      details: error.message
    });
  }
});

// Endpoint: Process product image & generate AI outputs
app.post('/api/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    const { productName, price, whatsapp } = req.body;

    if (!productName || !price || !whatsapp) {
      fs.unlink(imagePath, () => { });
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
    fs.unlink(imagePath, () => { });

    res.json(result);
  } catch (error) {
    console.error('Error processing image:', error);
    if (req.file) {
      fs.unlink(req.file.path, () => { });
    }
    res.status(500).json({
      error: 'Failed to process image',
      details: error.message
    });
  }
});

// Endpoint: Recommend UMKM Products
app.post('/api/recommend-products', async (req, res) => {
  try {
    const { category, budget, targetMarket, location } = req.body;

    if (!category || !budget || !targetMarket || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `Sebagai konsultan bisnis UMKM Indonesia, berikan 5 rekomendasi produk yang cocok untuk dijual berdasarkan data berikut:

Kategori Bisnis: ${category}
Budget Modal: IDR ${budget.toLocaleString('id-ID')}
Target Market: ${targetMarket}
Lokasi Usaha: ${location}

IMPORTANT: Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO extra text.

{
  "recommendations": [
    {
      "productName": "Nama produk yang spesifik",
      "reasoning": "Alasan mengapa produk ini cocok (2-3 kalimat dalam Bahasa Indonesia)",
      "estimatedHPP": harga_pokok_estimasi_number,
      "suggestedPrice": harga_jual_saran_number,
      "marketDemand": "Tinggi/Sedang/Rendah",
      "competitionLevel": "Tinggi/Sedang/Rendah",
      "profitPotential": "Tinggi/Sedang/Rendah"
    }
  ],
  "marketAnalysis": "Analisis pasar singkat untuk kategori ini di lokasi tersebut (2-3 kalimat)",
  "tips": ["Tip bisnis 1", "Tip bisnis 2", "Tip bisnis 3"]
}

Berikan 5 rekomendasi produk yang realistis dan sesuai dengan budget. Pastikan estimasi HPP dan harga jual masuk akal untuk pasar Indonesia.`;

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

    res.json(data);
  } catch (error) {
    console.error('Error recommending products:', error);
    res.status(500).json({
      error: 'Failed to recommend products',
      details: error.message
    });
  }
});

// Endpoint: Generate Bio Website (Linktree-style)
app.post('/api/generate-bio-website', async (req, res) => {
  try {
    const { businessName, tagline, links, theme, profileImage, socialLinks } = req.body;

    if (!businessName || !tagline || !links || !Array.isArray(links)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // AI suggestions for improvement
    const aiPrompt = `Sebagai copywriter profesional, tingkatkan bio website untuk bisnis UMKM berikut:

Nama Bisnis: ${businessName}
Tagline: ${tagline}

IMPORTANT: Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO extra text.

{
  "improvedTagline": "Tagline yang lebih menarik dan persuasif (max 80 chars)",
  "seoKeywords": "keyword1, keyword2, keyword3, keyword4, keyword5"
}`;

    let aiSuggestions = null;
    try {
      const aiResponseText = await callKolosalAI(aiPrompt);
      let aiJsonText = aiResponseText.trim();

      if (aiJsonText.includes('```json')) {
        const match = aiJsonText.match(/```json\n?([\s\S]*?)\n?```/);
        if (match) aiJsonText = match[1];
      }
      if (aiJsonText.includes('```')) {
        const match = aiJsonText.match(/```\n?([\s\S]*?)\n?```/);
        if (match) aiJsonText = match[1];
      }

      aiJsonText = aiJsonText.trim();
      aiSuggestions = JSON.parse(aiJsonText);
    } catch (aiError) {
      console.log('AI suggestions failed, using defaults:', aiError.message);
      aiSuggestions = {
        improvedTagline: tagline,
        seoKeywords: businessName
      };
    }

    const slug = toSlug(businessName);
    const backgroundColor = theme?.backgroundColor || '#0a0a0a';
    const buttonColor = theme?.buttonColor || '#ffffff';
    const textColor = theme?.textColor || '#ffffff';
    const layout = theme?.layout || 'modern';

    // Profile image HTML
    const profileImageHTML = profileImage
      ? `<img src="${profileImage}" alt="${businessName}" class="profile-image">`
      : `<div class="profile-placeholder">${businessName.charAt(0).toUpperCase()}</div>`;

    // Generate links HTML with icons based on platform
    const platformIconMap = {
      whatsapp: 'fa-brands fa-whatsapp',
      instagram: 'fa-brands fa-instagram',
      facebook: 'fa-brands fa-facebook',
      tiktok: 'fa-brands fa-tiktok',
      youtube: 'fa-brands fa-youtube',
      shopee: 'fa-solid fa-bag-shopping',
      tokopedia: 'fa-solid fa-bag-shopping',
      website: 'fa-solid fa-globe'
    };

    const linksHTML = links.map(link => {
      const iconClass = link.platform && platformIconMap[link.platform.toLowerCase()]
        ? platformIconMap[link.platform.toLowerCase()]
        : '';
      const iconHTML = iconClass ? `<i class="${iconClass}" style="margin-right: 8px;"></i>` : '';
      return `<a href="${link.url}" class="bio-link" target="_blank" rel="noopener">${iconHTML}${link.title}</a>`;
    }).join('');

    const bioWebsiteHTML = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="keywords" content="${aiSuggestions.seoKeywords}">
    <title>${businessName} - Bio Link</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${backgroundColor};
            color: ${textColor};
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }
        .container {
            max-width: 680px;
            width: 100%;
            text-align: center;
        }
        .profile-image {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            object-fit: cover;
            margin-bottom: 20px;
            border: 3px solid rgba(255,255,255,0.2);
        }
        .profile-placeholder {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            font-weight: 700;
            margin-bottom: 20px;
        }
        .business-name {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
        }
        .tagline {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 24px;
            line-height: 1.5;
        }
        .social-icons {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-bottom: 32px;
        }
        .social-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${textColor};
            text-decoration: none;
            transition: all 0.2s;
        }
        .social-icon:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
        }
        .links-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .bio-link {
            display: block;
            padding: 16px 24px;
            background: ${buttonColor};
            color: ${backgroundColor};
            text-decoration: none;
            border-radius: ${layout === 'modern' ? '8px' : layout === 'minimal' ? '4px' : '24px'};
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
        }
        .bio-link:hover {
            transform: translateY(-2px);
            opacity: 0.9;
        }
        .footer {
            margin-top: 48px;
            font-size: 12px;
            opacity: 0.4;
        }
        @media (max-width: 640px) {
            .business-name { font-size: 14px; }
            .tagline { font-size: 13px; }
        }
    </style>
</head>
<body>
    <div class="container">
        ${profileImageHTML}
        <h1 class="business-name">${businessName}</h1>
        <p class="tagline">${aiSuggestions.improvedTagline}</p>
        <div class="links-container">
            ${linksHTML}
        </div>
        <div class="footer">
            <p>Powered by BikinLaris</p>
        </div>
    </div>
</body>
</html>`;

    res.json({
      success: true,
      bioWebsiteHTML,
      slug,
      previewUrl: `/bio/${slug}`,
      aiSuggestions
    });

    // Save HTML to file for hosting
    const bioDir = path.join(__dirname, 'bio-pages');
    if (!fs.existsSync(bioDir)) {
      fs.mkdirSync(bioDir, { recursive: true });
    }
    fs.writeFileSync(path.join(bioDir, `${slug}.html`), bioWebsiteHTML);

  } catch (error) {
    console.error('Error generating bio website:', error);
    res.status(500).json({
      error: 'Failed to generate bio website',
      details: error.message
    });
  }
});

// Endpoint: Serve bio website pages
app.get('/bio/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const bioFilePath = path.join(__dirname, 'bio-pages', `${slug}.html`);

    if (fs.existsSync(bioFilePath)) {
      res.sendFile(bioFilePath);
    } else {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bio Not Found</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; background: #0a0a0a; color: white; }
            h1 { font-size: 48px; margin-bottom: 20px; }
            p { font-size: 18px; opacity: 0.7; }
          </style>
        </head>
        <body>
          <h1>404</h1>
          <p>Bio page not found</p>
          <p><a href="/" style="color: #667eea;">Go back to home</a></p>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error serving bio page:', error);
    res.status(500).send('Internal server error');
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

// Endpoint: Generate AI-styled background images (REMOVED)
// app.post('/api/generate-background', ...) - Removed as per user request

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
