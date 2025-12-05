# 🚀 BikinLaris - AI Asisten UMKM Indonesia

Platform pintar yang membantu UMKM Indonesia menghitung harga jual, mencari ide produk, dan membuat website bio link profesional secara instan menggunakan kecerdasan buatan (AI).

<img width="500" height="400" alt="ChatGPT Image 5 Des 2025, 22 41 37" src="https://github.com/user-attachments/assets/20fa1ee4-214e-4a01-9066-dcd72ed71dce" />


## ✨ Fitur Utama

### 1. 💰 Kalkulator HPP & Smart Pricing
- **Hitung HPP Akurat:** Input bahan baku, tenaga kerja, dan biaya lain-lain.
- **Rekomendasi Harga Jual:** AI menganalisis harga pasar dan memberikan rekomendasi harga optimal.
- **Analisis Profit:** Estimasi margin keuntungan (30-50%) dan harga minimum/maksimum yang aman.

### 2. 💡 Rekomendasi Ide Bisnis
Ingin mulai usaha tapi bingung jualan apa?
- **AI Product Match:** Dapatkan ide produk berdasarkan:
  - 📂 Kategori (Makanan, Fashion, Digital, dll)
  - 💰 Budget Modal
  - 🎯 Target Market
  - 📍 Lokasi Usaha
- **Analisis Pasar:** AI memberikan alasan kenapa produk tersebut cocok dan potensi keuntungannya.

### 3. 🌐 Bio Website Generator
Buat website link-in-bio profesional dalam hitungan detik!
- **Instant Website:** Cukup masukkan nama bisnis, tagline, dan link sosmed.
- **AI Copywriting:** AI otomatis membuatkan tagline yang menarik & SEO-friendly.
- **Theme System:** Pilih dari tampilan profesional:
  - 🎨 **Customizable:** Atur warna background, tombol, dan teks sesuka hati.
  - 🌟 **Curated Themes:** Modern Dark, Clean White, Vibrant Purple, Warm Sunset.
- **Live Preview:** Lihat perubahan tampilan secara real-time.
- **Download HTML:** Download file website siap pakai (hosting di mana saja).

### 4. ↩️ Navigasi Mudah
- Tombol **Back** yang intuitif untuk kemudahan navigasi antar halaman.

---

## 🛠️ Teknologi

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JS, Bootstrap 5, HTML5
- **AI Engine:** [Kolosal AI](https://kolosal.ai) (Model Qwen 3 30B - Optimized for Indonesian Context)
- **Styling:** CSS3, Bootstrap Icons, Google Fonts (Inter)

---

## 📋 Cara Install & Menjalankan

### Persyaratan
- Node.js (v16 atau lebih baru)
- NPM

### 1. Clone Project
```bash
git clone https://github.com/AimZ24/BikinLaris.git
cd BikinLaris
```

### 2. Install Dependencies
Masuk ke folder server dan install paket yang dibutuhkan:
```bash
cd server
npm install
```

### 3. Konfigurasi Environment
Buat file `.env` di dalam folder `server/` dan tambahkan API Key Kolosal AI:
```env
KOLOSAL_API_KEY=masukkan_api_key_disini
PORT=3000
```

### 4. Jalankan Server
```bash
npm start
```

### 5. Buka Aplikasi
Buka browser dan akses:
```
http://localhost:3000
```

---

## 📁 Struktur Project

```
BikinLaris/
├── public/                  # Frontend Files
│   ├── index.html           # Landing Page
│   ├── button.html          # Main Application (Tabs)
│   ├── app.js               # Logic & AI Integration
│   └── logo.png             # Assets
│
├── server/                  # Backend API
│   ├── index.js             # Express Server & API Routes
│   ├── .env                 # API Keys (Kolosal AI)
│   └── package.json         # Server Dependencies
│
└── README.md                # Dokumentasi Project
```

---

## 🤝 Kontribusi

Project ini dikembangkan untuk memberdayakan UMKM Indonesia melalui teknologi yang mudah dan terjangkau. Feedback dan kontribusi sangat diterima!

---

## 📄 Lisensi

© 2025 **BikinLaris**. All Rights Reserved.
Powered by **Kolosal AI**.

