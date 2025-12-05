# 🚀 Deploy BikinLaris ke Vercel

## Persiapan

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login ke Vercel
```bash
vercel login
```

## Deploy ke Vercel

### 1. Deploy Pertama Kali
Dari root folder project (`/opt/lampp/htdocs/BikinLaris`):

```bash
vercel
```

Jawab pertanyaan:
- **Set up and deploy?** → Yes
- **Which scope?** → Pilih account Anda
- **Link to existing project?** → No
- **Project name?** → `bikinlaris` (atau nama lain)
- **Directory?** → `.` (enter saja)
- **Override settings?** → No

### 2. Set Environment Variables
Setelah deploy pertama, set API key:

```bash
vercel env add KOLOSAL_API_KEY
```

Paste API key Kolosal Anda, lalu pilih:
- **Production** → Yes
- **Preview** → Yes  
- **Development** → Yes

### 3. Deploy Production
```bash
vercel --prod
```

## Setelah Deploy

Vercel akan memberikan URL seperti:
- **Production**: `https://bikinlaris.vercel.app`
- **Preview**: `https://bikinlaris-xxx.vercel.app`

Bio website akan accessible di:
- `https://bikinlaris.vercel.app/bio/toko-kue-ibu`
- `https://bikinlaris.vercel.app/bio/warung-makan`

## Custom Domain (Optional)

1. Beli domain (Namecheap, GoDaddy, dll)
2. Di Vercel dashboard → Settings → Domains
3. Add domain Anda (contoh: `bikinlaris.com`)
4. Update DNS records sesuai instruksi Vercel
5. Bio links jadi: `bikinlaris.com/bio/toko-kue`

## Update Aplikasi

Setiap kali ada perubahan code:

```bash
git add .
git commit -m "Update features"
git push
```

Atau manual deploy:
```bash
vercel --prod
```

## Troubleshooting

### Error: Missing dependencies
```bash
cd server
npm install
cd ..
vercel --prod
```

### Error: Environment variables
Cek di Vercel dashboard → Settings → Environment Variables
Pastikan `KOLOSAL_API_KEY` sudah diset

### Bio pages tidak tersimpan
Vercel menggunakan serverless functions yang ephemeral. Untuk production, pertimbangkan:
1. Gunakan Vercel KV (key-value storage)
2. Atau database seperti MongoDB/PostgreSQL
3. Atau cloud storage seperti AWS S3

## Notes

⚠️ **PENTING**: 
- File `bio-pages` di Vercel bersifat temporary (akan hilang setelah function restart)
- Untuk production yang proper, gunakan database atau cloud storage
- Vercel free tier memiliki limit:
  - 100GB bandwidth/month
  - 100 serverless function invocations/day
  - 10 second function timeout

## Alternative: Persistent Storage

Jika ingin bio pages tetap tersimpan, tambahkan database:

### Option 1: Vercel KV (Redis)
```bash
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
```

### Option 2: MongoDB Atlas (Free)
1. Buat account di mongodb.com
2. Create cluster (free tier)
3. Get connection string
4. Add environment variable:
```bash
vercel env add MONGODB_URI
```

Butuh bantuan implementasi database? 🤔
