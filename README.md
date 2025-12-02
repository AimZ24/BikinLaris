# 🚀 BikinLaris - AI Digital Rebranding untuk UMKM

Platform AI yang powerful untuk membantu UMKM Indonesia dengan branding digital, marketing automation, dan website builder instant.

## ✨ Fitur Utama

### 1. 📸 AI Product Image Processing
- Upload foto produk → AI memproses dan membersihkan gambar
- Generate 3 output terbaik dengan AI Copywriting:
  - **Deskripsi Produk** yang menjual & persuasif
  - **Caption Instagram** dengan CTA & emoji yang tepat
  - **SEO Keywords** untuk visibility
  - **Hashtags** untuk jangkauan maksimal

### 2. 🎨 Generator Poster Promosi
- **3 Template Profesional:**
  - Template 1: Modern Minimalist (clean & elegant)
  - Template 2: Dark Elegant (sophisticated)
  - Template 3: Vibrant Pop (eye-catching)
- AI auto-fill teks, harga, dan design
- Export PNG HD ready
- Real-time preview

### 3. 🚀 One-Click Marketing
Sekali klik menghasilkan:
- ✅ Poster promosi
- ✅ Caption + Hashtags
- ✅ WhatsApp order link
- Langsung ready untuk dibagikan ke semua platform

### 4. 💬 WhatsApp Order Link Generator
- Format pesanan otomatis dan professional
- Langsung bisa dibagikan ke WhatsApp
- Compatible dengan semua device
- Increase conversion rate

### 5. 🌐 Instant Microsite Builder
Microsite dibuat otomatis hanya dari:
- 📷 Foto produk
- 📝 Nama produk
- 💰 Harga
- 📱 Nomor WhatsApp

**AI Auto-Generate:**
- ✨ Copywriting website (headline, subheadline, CTA)
- 🎯 Layout microsite responsif (hero, produk, testimonial, CTA)
- 📍 URL microsite berbasis slug nama bisnis
- 📱 Design clean, mobile-first
- ⚡ Instant ready-to-share

---

## 🛠️ Tech Stack

- **Backend:** Express.js (Node.js) - Lightweight & Fast
- **Frontend:** Vanilla JavaScript + HTML5 Canvas
- **AI Engine:** Google Gemini API (gemini-1.5-flash) - Vision + Text
- **File Upload:** Multer
- **Environment:** .env for secure API keys

---

## 📋 Setup & Installation

### Prerequisites
- Node.js v14+
- npm atau yarn
- Modern web browser

### Step 1: Clone/Download Project
```bash
cd c:\xampp\htdocs\BikinLaris
```

### Step 2: Install Dependencies
```bash
cd server
npm install
```

### Step 3: Configure Environment
File `.env` sudah ada di folder `server/` dengan:
```
GEMINI_API_KEY=AIzaSyDBDSvQmwa-fZ1p4kZyYIEDzyPNrmd0XGU
PORT=3000
NODE_ENV=development
```

### Step 4: Run Server
```bash
npm start
```

Output:
```
🚀 BikinLaris server running on http://localhost:3000
```

### Step 5: Open Browser
```
http://localhost:3000
```

---

## 🎯 How to Use

### 1️⃣ Upload & Process Product
- Upload foto produk (JPG/PNG)
- Input nama produk
- Input harga
- Input nomor WhatsApp
- Click "✨ Proses dengan AI"

### 2️⃣ View AI Results
Tunggu 5-10 detik, AI akan generate:
- Deskripsi produk yang menjual
- Caption Instagram dengan emoji
- SEO keywords
- Hashtags

### 3️⃣ Create Poster
- Click "🎨 Buat Poster"
- Pilih dari 3 template
- Preview otomatis update
- Click "📥 Download Poster"

### 4️⃣ One-Click Marketing
- Click "🚀 One-Click Marketing"
- Semua konten & poster otomatis disiapkan
- Langsung ready dibagikan

### 5️⃣ Generate Microsite
- Click "🌐 Buat Website"
- Tunggu AI membuat website
- Preview microsite Anda
- Download atau bagikan link

---

## 📁 Project Structure

```
BikinLaris/
├── server/
│   ├── index.js                 # Backend API
│   ├── package.json             # Dependencies
│   ├── .env                      # API Key & Config
│   ├── uploads/                 # Temp file storage
│   └── test_api.js              # Testing utilities
│
├── public/
│   ├── index.html               # Main UI
│   ├── app.js                   # Frontend logic
│   ├── style.css                # Styling
│   └── templates/
│       ├── template1.html       # Modern Minimalist
│       ├── template2.html       # Dark Elegant
│       └── template3.html       # Vibrant Pop
│
└── README.md                    # This file
```

---

## 🔧 API Endpoints

### 1. Process Product Image
```
POST /api/process
Content-Type: multipart/form-data

Body:
- image: (File)
- productName: string
- price: number
- whatsapp: string

Response:
{
  "description": "Compelling product description",
  "caption": "Instagram caption with CTA",
  "seo": "keyword1, keyword2, keyword3",
  "posterHeadline": "Catchy headline",
  "posterSub": "Sub-headline",
  "hashtags": "#tag1 #tag2 #tag3"
}
```

### 2. Generate Microsite
```
POST /api/microsite
Content-Type: application/json

Body:
{
  "productName": "Product Name",
  "price": "25000",
  "whatsapp": "62812345678"
}

Response:
{
  "headline": "Main headline",
  "subheadline": "Sub-headline",
  "description": "Product description",
  "benefits": ["Benefit1", "Benefit2", "Benefit3"],
  "cta": "Call to action text",
  "testimonial": "Sample testimonial",
  "slug": "product-name",
  "price": "IDR 25,000"
}
```

### 3. Generate WhatsApp Link
```
POST /api/wa-link
Content-Type: application/json

Body:
{
  "productName": "Product Name",
  "price": "25000",
  "whatsapp": "62812345678",
  "quantity": 1
}

Response:
{
  "success": true,
  "waLink": "https://wa.me/62812345678?text=...",
  "message": "Formatted order message",
  "formattedPrice": "IDR 25,000"
}
```

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Frontend)
```bash
npm install -g vercel
vercel
```

### Option 2: Heroku
```bash
npm install -g heroku
heroku login
heroku create your-app-name
git push heroku main
```

### Option 3: Self-Hosted (XAMPP)
Project sudah siap di:
```
c:\xampp\htdocs\BikinLaris
```

---

## 🔐 Security Tips

1. **Keep API Key Secret:**
   - Never commit `.env` to public repo
   - Use `.gitignore` untuk `.env`

2. **Input Validation:**
   - Server sudah validate semua input
   - Frontend juga validate sebelum kirim

3. **File Upload:**
   - Max file size: Default (check multer config)
   - Auto cleanup uploaded files setelah processing

4. **Rate Limiting:**
   - Implementasi rate limiter untuk production
   - Prevent abuse di Gemini API

---

## 🐛 Troubleshooting

### Error: "GEMINI_API_KEY not found"
**Solution:** Pastikan file `.env` ada di folder `server/` dengan API key yang benar

### Error: "Cannot find module..."
**Solution:** Run `npm install` di folder `server/`

### Image Processing Timeout
**Solution:** Cek koneksi internet, ukuran file foto (max 4MB recommended)

### WhatsApp Link tidak berfungsi
**Solution:** Pastikan format nomor WhatsApp benar (contoh: 62812345678 atau +62812345678)

---

## 📊 Performance Tips

1. **Image Optimization:**
   - Gunakan JPG untuk foto produk (lebih kecil dari PNG)
   - Resize foto ke max 2000x2000px

2. **Browser Caching:**
   - Frontend sudah optimized
   - Gunakan browser cache untuk faster loading

3. **API Response:**
   - Gemini API biasanya 5-10 detik per request
   - Untuk batch processing, tunggu completion

---

## 🤝 Contributing

Untuk contribute atau report bug, silakan:
1. Test fitur secara menyeluruh
2. Document perubahan dengan jelas
3. Submit dengan deskripsi lengkap

---

## 📞 Support & Contact

Untuk pertanyaan atau bantuan:
- 💬 WhatsApp: [Hubungi support]
- 📧 Email: support@bikinlaris.com
- 🐛 Issues: Report di GitHub

---

## 📄 License

BikinLaris © 2024. Built with ❤️ for UMKM Indonesia.

---

## 🎓 Pembelajaran dari Project

Fitur & teknik yang digunakan:

✅ Multi-file upload handling (Multer)
✅ Base64 image encoding untuk API
✅ Canvas API untuk poster generation
✅ Dynamic HTML generation
✅ iframe untuk microsite preview
✅ URL encoding untuk WhatsApp links
✅ Promise-based async/await
✅ Error handling & validation
✅ Responsive design (mobile-first)
✅ Modern CSS (Grid, Flexbox, Gradients)

---

## 🌟 Future Enhancements

- [ ] Database integration untuk save projects
- [ ] User authentication & dashboard
- [ ] A/B testing untuk different captions
- [ ] Multi-language support
- [ ] Email templates
- [ ] Advanced analytics
- [ ] PDF export untuk reports
- [ ] Integration dengan Shopify/WooCommerce
- [ ] Social media scheduling
- [ ] Mobile app (React Native/Flutter)

---

**Made with ❤️ by BikinLaris Team**

**Empowering UMKM Indonesia with AI Technology** 🚀✨
