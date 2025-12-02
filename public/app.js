document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const resultSection = document.getElementById('resultSection');
    const posterSection = document.getElementById('posterSection');
    const micrositeSection = document.getElementById('micrositeSection');

    // State to hold current data
    let currentData = null;
    let currentImageBlob = null;
    let micrositeData = null;

    // ========== UPLOAD & PROCESS SECTION ==========
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);

        // Show loading state
        const btn = uploadForm.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = '🔄 Processing...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            currentData = data;

            // Store image blob for poster drawing
            const fileInput = document.getElementById('productImage');
            if (fileInput.files && fileInput.files[0]) {
                currentImageBlob = fileInput.files[0];
            }

            displayResults(data);
            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    function displayResults(data) {
        const desc = document.getElementById('description');
        const cap = document.getElementById('caption');
        const seo = document.getElementById('seo');

        desc.innerHTML = `
            <div class="result-card">
                <h3>📝 Product Description</h3>
                <p>${data.description}</p>
            </div>
        `;

        cap.innerHTML = `
            <div class="result-card">
                <h3>📸 Instagram Caption</h3>
                <p>${data.caption}</p>
                <button class="copy-btn" onclick="copyToClipboard('${data.caption}')">📋 Copy Caption</button>
            </div>
        `;

        seo.innerHTML = `
            <div class="result-card">
                <h3>🔍 SEO Keywords</h3>
                <p>${data.seo}</p>
            </div>
        `;

        // Add hashtags display
        if (data.hashtags) {
            const hashtagDiv = document.createElement('div');
            hashtagDiv.className = 'result-card';
            hashtagDiv.innerHTML = `
                <h3>#️⃣ Hashtags</h3>
                <p>${data.hashtags}</p>
                <button class="copy-btn" onclick="copyToClipboard('${data.hashtags}')">📋 Copy Hashtags</button>
            `;
            seo.parentNode.insertBefore(hashtagDiv, seo.nextSibling);
        }
    }

    // Poster Generation (AI-driven spec)
    const generatePosterBtn = document.getElementById('generatePosterBtn');
    const templateSelect = document.getElementById('templateSelect');
    let currentPosterSpec = null;

    generatePosterBtn.addEventListener('click', async () => {
        if (!currentData || !currentImageBlob) {
            alert('❌ Please process an image first');
            return;
        }

        // Request AI poster spec from backend
        const payload = {
            productName: document.getElementById('productName').value,
            price: document.getElementById('productPrice').value,
            whatsapp: document.getElementById('whatsapp').value
        };

        generatePosterBtn.textContent = '⏳ Generating design...';
        generatePosterBtn.disabled = true;

        try {
            const resp = await fetch('/api/poster-spec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error('Failed to get poster spec');
            const { success, spec } = await resp.json();
            if (!success) throw new Error('AI returned error');

            currentPosterSpec = spec;
            posterSection.style.display = 'block';
            await drawPosterWithSpec(currentPosterSpec, { editable: true });
            posterSection.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            console.error(err);
            alert('Failed to generate poster design');
        } finally {
            generatePosterBtn.textContent = '🎨 Buat Poster';
            generatePosterBtn.disabled = false;
        }
    });

    templateSelect.addEventListener('change', async () => {
        if (currentPosterSpec) await drawPosterWithSpec(currentPosterSpec, { editable: true });
    });

    async function drawPosterWithSpec(spec, options = {}) {
        if (!currentData || !currentImageBlob) return;

        const canvas = document.getElementById('posterCanvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = URL.createObjectURL(currentImageBlob);
        await new Promise(r => img.onload = r);

        // Make sizes easy to reason about
        const W = canvas.width;
        const H = canvas.height;
        const outerPadding = Math.round(Math.min(W, H) * 0.05);

        // Clear canvas
        ctx.clearRect(0, 0, W, H);

        // Draw rounded card background with subtle shadow
        const cardRadius = 18;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.12)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        // If AI returned a background image URL, draw it as a cover behind the card
        if (spec.background && (spec.background.startsWith('http') || spec.background.startsWith('/uploads') || spec.background.startsWith('data:'))) {
            const bgImg = new Image();
            try {
                await new Promise(r => { bgImg.onload = r; bgImg.onerror = r; bgImg.src = spec.background; });
                // clip to rounded card then draw cover-fit image
                roundRect(ctx, outerPadding, outerPadding, W - outerPadding*2, H - outerPadding*2, cardRadius, false, false);
                ctx.clip();
                const bw = bgImg.width || 1;
                const bh = bgImg.height || 1;
                const areaW = W - outerPadding*2;
                const areaH = H - outerPadding*2;
                const ratio = Math.max(areaW / bw, areaH / bh);
                const drawW = bw * ratio;
                const drawH = bh * ratio;
                const drawX = outerPadding - (drawW - areaW) / 2;
                const drawY = outerPadding - (drawH - areaH) / 2;
                ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
            } catch (e) {
                // fallback to plain fill if image failed
                ctx.fillStyle = spec.background || '#f8efe4';
                roundRect(ctx, outerPadding, outerPadding, W - outerPadding*2, H - outerPadding*2, cardRadius, true, false);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = spec.background && spec.background.startsWith('linear-gradient') ? '#fff' : (spec.background || '#f8efe4');
            roundRect(ctx, outerPadding, outerPadding, W - outerPadding*2, H - outerPadding*2, cardRadius, true, false);
            ctx.restore();
        }

        // Inner padding for content
        const innerX = outerPadding + 28;
        const innerW = W - innerX - 28;
        let cursorY = outerPadding + 28;

        // Draw image area (cover crop) with rounded corners
        const imgAreaH = Math.round(H * 0.46);
        const imgX = innerX;
        const imgY = cursorY;
        const imgW = innerW;
        const imgH = imgAreaH;

        // Clip & draw cover-fit image
        ctx.save();
        const imgRadius = 12;
        roundRect(ctx, imgX, imgY, imgW, imgH, imgRadius, false, false);
        ctx.clip();

        // Cover scaling calculation
        const ratio = Math.max(imgW / img.width, imgH / img.height);
        const drawW = img.width * ratio;
        const drawH = img.height * ratio;
        const drawX = imgX - (drawW - imgW) / 2;
        const drawY = imgY - (drawH - imgH) / 2;
        // simple brightening if suggested
        if (spec.imageEffect && spec.imageEffect.includes('brighten')) {
            // draw image then overlay slight white with low opacity
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(imgX, imgY, imgW, imgH);
        } else {
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
        ctx.restore();

        // Advance cursor
        cursorY += imgH + 20;

        // Headline
        ctx.fillStyle = spec.primaryColor || '#2b2b2b';
        ctx.textAlign = 'center';
        const headlineSize = spec.headlineSize || 40;
        ctx.font = `700 ${headlineSize}px ${spec.font || 'Inter, Arial, sans-serif'}`;
        wrapText(ctx, spec.headline || currentData.posterHeadline || currentData.description.split('.')[0], W/2, cursorY, innerW, headlineSize + 8);
        cursorY += headlineSize * 1.6;

        // Subheadline
        ctx.fillStyle = '#6b6b6b';
        const subSize = spec.subheadlineSize || 18;
        ctx.font = `${subSize}px ${spec.font || 'Inter, Arial, sans-serif'}`;
        wrapText(ctx, spec.subheadline || currentData.posterSub || '', W/2, cursorY + 4, innerW, subSize + 6);
        cursorY += subSize * 2.2;

        // Price badge (refined): small circle with subtle border and drop shadow
        const priceStyle = spec.priceStyle || 'badge';
        if (priceStyle === 'badge') {
            const badgeR = 44;
            const px = W - outerPadding - badgeR - 24;
            const py = outerPadding + imgH - badgeR - 12;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
            ctx.beginPath(); ctx.fillStyle = spec.priceColor || '#ffd166'; ctx.arc(px, py, badgeR, 0, Math.PI*2); ctx.fill();
            ctx.restore();

            ctx.beginPath(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.arc(px, py, badgeR - 6, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = '#1a1a1a'; ctx.font = '700 20px Inter, Arial'; ctx.textAlign = 'center'; ctx.fillText(spec.priceText || `IDR ${document.getElementById('productPrice').value}`, px, py + 8);
        } else {
            // simple line price under headline
            ctx.fillStyle = spec.priceColor || '#333';
            ctx.font = '700 22px Inter, Arial'; ctx.textAlign = 'center';
            ctx.fillText(spec.priceText || `IDR ${document.getElementById('productPrice').value}`, W/2, cursorY + 16);
            cursorY += 36;
        }

        // CTA button - centered pill with subtle gradient and shadow
        const ctaW = 220;
        const ctaH = 46;
        const ctaX = (W - ctaW)/2;
        const ctaY = H - outerPadding - ctaH - 28;
        ctx.save();
        const grad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY + ctaH);
        grad.addColorStop(0, spec.ctaColor || '#2ecc71');
        grad.addColorStop(1, shadeColor(spec.ctaColor || '#2ecc71', -8));
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.16)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
        roundRect(ctx, ctaX, ctaY, ctaW, ctaH, 10, true, false);
        ctx.restore();

        ctx.fillStyle = '#fff'; ctx.font = '700 18px Inter, Arial'; ctx.textAlign = 'center'; ctx.fillText(spec.ctaText || 'Pesan Sekarang', W/2, ctaY + ctaH/2 + 7);

        // If editable requested, compute simple metrics and create overlays
        if (options && options.editable) {
            const headlineY = outerPadding + 28 + imgH + 20;
            const subheadlineY = headlineY + (spec.headlineSize || 40) * 1.6 + 6;
            createEditorOverlays(spec, { W, H, outerPadding, innerX, innerW, imgX, imgY, imgW, imgH, headlineY, subheadlineY, ctaX, ctaY, ctaW, ctaH });
        }
    }

    // helpers used by drawPosterWithSpec
    function roundRect(ctx, x, y, w, h, r, fill, stroke) {
        if (typeof r === 'undefined') r = 5;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    // small utility to darken/lighten a hex color
    function shadeColor(hex, percent) {
        try {
            const c = hex.replace('#','');
            const num = parseInt(c,16);
            let r = (num >> 16) + percent;
            let g = ((num >> 8) & 0x00FF) + percent;
            let b = (num & 0x0000FF) + percent;
            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));
            return '#' + (r<<16 | g<<8 | b).toString(16).padStart(6,'0');
        } catch (e) {
            return hex;
        }
    }

    // Helper: Wrap text on canvas
    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    }

    // ================= Overlay editor functions =================
    function createEditorOverlays(spec, metrics) {
        const overlayLayer = document.getElementById('overlayLayer');
        if (!overlayLayer) return;
        overlayLayer.innerHTML = '';
        overlayLayer.style.display = 'block';
        overlayLayer.style.pointerEvents = 'none';

        const canvas = document.getElementById('posterCanvas');
        const rect = canvas.getBoundingClientRect();

        function make(id, text, leftPx, topPx, opts = {}) {
            const el = document.createElement('div');
            el.className = 'overlay-el';
            el.id = id;
            el.textContent = text || '';
            el.style.left = typeof leftPx === 'number' ? `${leftPx}px` : leftPx;
            el.style.top = `${topPx}px`;
            if (opts.width) el.style.width = opts.width + 'px';
            el.style.color = opts.color || (spec.primaryColor || '#222');
            el.style.fontSize = (opts.size || 32) + 'px';
            el.style.fontFamily = opts.font || (spec.font || 'Inter, Arial, sans-serif');
            el.style.textAlign = opts.align || 'center';
            el.contentEditable = false;
            el.style.pointerEvents = 'auto';
            overlayLayer.appendChild(el);
            enableDrag(el);
            el.addEventListener('click', (e) => { selectOverlay(el); e.stopPropagation(); });
            return el;
        }

        // headline centered
        const headlineX = rect.width / 2;
        const headlineEl = make('overlay-headline', spec.headline || currentData.posterHeadline || '', headlineX, metrics.headlineY, { width: metrics.innerW, size: spec.headlineSize || 40 });
        headlineEl.style.transform = 'translateX(-50%)';

        const subEl = make('overlay-sub', spec.subheadline || currentData.posterSub || '', headlineX, metrics.subheadlineY, { width: metrics.innerW, size: spec.subheadlineSize || 18 });
        subEl.style.transform = 'translateX(-50%)';

        // price near badge
        const badgeR = 44;
        const px = metrics.W - metrics.outerPadding - badgeR - 24;
        const py = metrics.outerPadding + metrics.imgH - badgeR - 12;
        const priceEl = make('overlay-price', spec.priceText || `IDR ${document.getElementById('productPrice').value}`, px, py - 10, { size: 18 });
        priceEl.style.transform = 'translate(-50%,-50%)';

        // CTA
        const ctaEl = make('overlay-cta', spec.ctaText || 'Pesan Sekarang', metrics.W/2, metrics.ctaY + metrics.ctaH/2 - 8, { size: 18 });
        ctaEl.style.transform = 'translateX(-50%)';

        overlayState.elements = { headlineEl, subEl, priceEl, ctaEl };
    }

    const overlayState = { dragging: null, offsetX: 0, offsetY: 0, selected: null, elements: {} };

    function enableDrag(el) {
        el.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
            overlayState.dragging = el;
            const rect = el.getBoundingClientRect();
            overlayState.offsetX = ev.clientX - rect.left;
            overlayState.offsetY = ev.clientY - rect.top;
            document.addEventListener('pointermove', onDrag);
            document.addEventListener('pointerup', onRelease);
        });
    }

    function onDrag(ev) {
        if (!overlayState.dragging) return;
        const canvasRect = document.getElementById('posterCanvas').getBoundingClientRect();
        let left = ev.clientX - canvasRect.left - overlayState.offsetX;
        let top = ev.clientY - canvasRect.top - overlayState.offsetY;
        overlayState.dragging.style.left = left + 'px';
        overlayState.dragging.style.top = top + 'px';
    }

    function onRelease() {
        overlayState.dragging = null;
        document.removeEventListener('pointermove', onDrag);
        document.removeEventListener('pointerup', onRelease);
    }

    function selectOverlay(el) {
        if (overlayState.selected) overlayState.selected.classList.remove('selected');
        overlayState.selected = el;
        el.classList.add('selected');
        const color = window.getComputedStyle(el).color;
        document.getElementById('colorPicker').value = rgbToHex(color);
        const size = parseInt(window.getComputedStyle(el).fontSize || '32');
        document.getElementById('fontSizeRange').value = size;
    }

    // apply overlays into canvas
    async function applyOverlaysToCanvas() {
        if (!currentPosterSpec) return;
        // redraw base
        await drawPosterWithSpec(currentPosterSpec, { editable: false });
        const canvas = document.getElementById('posterCanvas');
        const ctx = canvas.getContext('2d');
        const canvasRect = canvas.getBoundingClientRect();

        for (const key of Object.keys(overlayState.elements)) {
            const el = overlayState.elements[key];
            if (!el) continue;
            const style = window.getComputedStyle(el);
            const left = parseFloat(el.style.left || el.offsetLeft);
            const top = parseFloat(el.style.top || el.offsetTop);
            const fontSize = parseInt(style.fontSize || '24');
            const text = el.textContent.trim();
            // draw text scaled to canvas resolution
            const scaleX = canvas.width / canvasRect.width;
            const scaleY = canvas.height / canvasRect.height;
            ctx.save();
            ctx.scale(scaleX, scaleY);
            ctx.fillStyle = style.color || '#222';
            ctx.textAlign = 'center';
            ctx.font = `${style.fontWeight || '700'} ${fontSize}px ${style.fontFamily || 'Inter, Arial'}`;
            const x = left + (el.offsetWidth || 100) / 2;
            const y = top + fontSize;
            ctx.fillText(text, x, y);
            ctx.restore();
        }
        document.getElementById('overlayLayer').style.display = 'none';
        document.getElementById('applyEditsBtn').style.display = 'none';
        document.getElementById('toggleEditBtn').textContent = '✏️ Edit Poster';
    }

    // utils
    function rgbToHex(rgb) {
        try {
            const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!m) return '#000000';
            const r = parseInt(m[1]).toString(16).padStart(2,'0');
            const g = parseInt(m[2]).toString(16).padStart(2,'0');
            const b = parseInt(m[3]).toString(16).padStart(2,'0');
            return `#${r}${g}${b}`;
        } catch (e) { return '#000000'; }
    }

    // wire up editor controls
    document.getElementById('toggleEditBtn').addEventListener('click', () => {
        const layer = document.getElementById('overlayLayer');
        if (!layer) return;
        if (layer.style.pointerEvents === 'auto') {
            layer.style.pointerEvents = 'none';
            layer.querySelectorAll('.overlay-el').forEach(e => e.contentEditable = false);
            document.getElementById('applyEditsBtn').style.display = 'none';
            document.getElementById('toggleEditBtn').textContent = '✏️ Edit Poster';
        } else {
            layer.style.pointerEvents = 'auto';
            layer.querySelectorAll('.overlay-el').forEach(e => e.contentEditable = true);
            document.getElementById('applyEditsBtn').style.display = 'inline-block';
            document.getElementById('toggleEditBtn').textContent = '🔒 Finish Editing';
        }
    });

    document.getElementById('applyEditsBtn').addEventListener('click', applyOverlaysToCanvas);
    document.getElementById('colorPicker').addEventListener('input', (e) => { if (overlayState.selected) overlayState.selected.style.color = e.target.value; });
    document.getElementById('fontSizeRange').addEventListener('input', (e) => { if (overlayState.selected) overlayState.selected.style.fontSize = e.target.value + 'px'; });

    // Generate AI backgrounds and show variants
    document.getElementById('generateBgBtn').addEventListener('click', async () => {
        if (!currentData) {
            alert('❌ Please process an image first');
            return;
        }

        const btn = document.getElementById('generateBgBtn');
        btn.textContent = '⏳ Generating...';
        btn.disabled = true;

        try {
            const payload = {
                productName: document.getElementById('productName').value,
                // try to provide a palette hint if available
                palette: (currentPosterSpec && currentPosterSpec.palette) || currentData.palette || null,
                mood: 'clean product photo, light, airy, e-commerce hero',
                variants: 3
            };

            const resp = await fetch('/api/generate-background', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const t = await resp.text();
                throw new Error(t || resp.statusText);
            }

            const data = await resp.json();
            if (data.error) throw new Error(data.error);

            const container = document.getElementById('backgroundVariants');
            container.innerHTML = '';
            (data.variants || []).forEach(v => {
                const thumb = document.createElement('img');
                thumb.src = v.imageUrl;
                thumb.style.width = '160px';
                thumb.style.height = '240px';
                thumb.style.objectFit = 'cover';
                thumb.style.borderRadius = '8px';
                thumb.style.cursor = 'pointer';
                thumb.title = 'Click to apply background';
                thumb.addEventListener('click', async () => {
                    if (!currentPosterSpec) currentPosterSpec = {};
                    // apply selected background url and re-render poster
                    currentPosterSpec.background = v.imageUrl;
                    await drawPosterWithSpec(currentPosterSpec, { editable: true });
                });
                container.appendChild(thumb);
            });
        } catch (err) {
            console.error('Background generation error:', err);
            alert('Background generation failed: ' + (err.message || err));
        } finally {
            btn.textContent = '🖼️ Generate Background (AI)';
            btn.disabled = false;
        }
    });


    // ========== DOWNLOAD POSTER ==========
    document.getElementById('downloadPosterBtn').addEventListener('click', () => {
        const canvas = document.getElementById('posterCanvas');
        const link = document.createElement('a');
        link.download = `poster-${new Date().getTime()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        alert('✅ Poster downloaded!');
    });

    // ========== ONE-CLICK MARKETING ==========
    document.getElementById('oneClickMarketingBtn').addEventListener('click', async () => {
        if (!currentData) {
            alert('❌ Please process an image first');
            return;
        }

        try {
            const btn = document.getElementById('oneClickMarketingBtn');
            btn.textContent = '⏳ Preparing...';
            btn.disabled = true;

            // Combine all marketing content
            const text = `${currentData.caption}\n\n${currentData.hashtags || currentData.seo}`;
            
            // Copy to clipboard
            await navigator.clipboard.writeText(text);
            alert('✅ Marketing content copied to clipboard!\n📋 Caption + Hashtags ready to paste');

            // Download poster
            document.getElementById('downloadPosterBtn').click();

            // Generate WA link
            const waResponse = await fetch('/api/wa-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: document.getElementById('productName').value,
                    price: document.getElementById('productPrice').value,
                    whatsapp: document.getElementById('whatsapp').value
                })
            });

            const waData = await waResponse.json();
            alert(`✅ WhatsApp link created!\n📱 Click to share: ${waData.waLink}`);

            btn.textContent = '🚀 One-Click Marketing';
            btn.disabled = false;
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
            document.getElementById('oneClickMarketingBtn').disabled = false;
            document.getElementById('oneClickMarketingBtn').textContent = '🚀 One-Click Marketing';
        }
    });

    // ========== MICROSITE GENERATOR ==========
    document.getElementById('generateMicrositeBtn').addEventListener('click', async () => {
        if (!currentData) {
            alert('❌ Please process an image first');
            return;
        }

        const btn = document.getElementById('generateMicrositeBtn');
        btn.textContent = '⏳ Generating Microsite...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/microsite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: document.getElementById('productName').value,
                    price: document.getElementById('productPrice').value,
                    whatsapp: document.getElementById('whatsapp').value
                })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            micrositeData = data;

            // Generate microsite HTML
            const productImage = currentImageBlob ? URL.createObjectURL(currentImageBlob) : 'https://via.placeholder.com/400';
            
            const micrositeHTML = generateMicrositeHTML(data, productImage);

            // Display in iframe
            micrositeSection.style.display = 'block';
            const iframe = document.getElementById('micrositeIframe');
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(micrositeHTML);
            iframe.contentWindow.document.close();

            // Add download button
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = '📥 Download Microsite HTML';
            downloadBtn.style.marginTop = '20px';
            downloadBtn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(micrositeHTML);
                link.download = `microsite-${toSlug(document.getElementById('productName').value)}.html`;
                link.click();
            });

            const downloadContainer = document.getElementById('micrositeSection').querySelector('.download-container') || 
                                      document.createElement('div');
            downloadContainer.className = 'download-container';
            downloadContainer.style.textAlign = 'center';
            downloadContainer.innerHTML = '';
            downloadContainer.appendChild(downloadBtn);

            if (!document.getElementById('micrositeSection').querySelector('.download-container')) {
                document.getElementById('micrositeSection').appendChild(downloadContainer);
            }

            micrositeSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            btn.textContent = '🌐 Generate Microsite';
            btn.disabled = false;
        }
    });

    // Helper: Generate microsite HTML
    function generateMicrositeHTML(data, imageUrl) {
        const whatsapp = document.getElementById('whatsapp').value;
        const productName = document.getElementById('productName').value;
        const slug = toSlug(productName);

        return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.headline} - ${productName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            background: #f8f9fa;
        }

        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }

        header nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
        }

        header .logo {
            font-size: 24px;
            font-weight: 700;
        }

        header .wa-link {
            background: #25d366;
            color: white;
            padding: 10px 20px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s;
        }

        header .wa-link:hover {
            transform: scale(1.05);
        }

        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 20px;
            text-align: center;
        }

        .hero-content {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
        }

        .hero-text h1 {
            font-size: 48px;
            margin-bottom: 20px;
            line-height: 1.2;
        }

        .hero-text p {
            font-size: 18px;
            margin-bottom: 30px;
            opacity: 0.95;
        }

        .hero-image {
            text-align: center;
        }

        .hero-image img {
            max-width: 100%;
            height: auto;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .cta-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
        }

        .cta-btn {
            padding: 16px 32px;
            font-size: 16px;
            font-weight: 600;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
        }

        .cta-primary {
            background: #25d366;
            color: white;
        }

        .cta-primary:hover {
            background: #20ba5f;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(37, 211, 102, 0.4);
        }

        .cta-secondary {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
        }

        .cta-secondary:hover {
            background: #f0f0f0;
            transform: translateY(-2px);
        }

        .benefits {
            background: white;
            padding: 60px 20px;
        }

        .benefits-content {
            max-width: 1200px;
            margin: 0 auto;
        }

        .benefits-content h2 {
            text-align: center;
            font-size: 36px;
            margin-bottom: 40px;
            color: #333;
        }

        .benefits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
        }

        .benefit-card {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .benefit-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.1);
        }

        .benefit-card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 20px;
        }

        .benefit-card p {
            color: #666;
            font-size: 14px;
        }

        .testimonials {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 20px;
        }

        .testimonials-content {
            max-width: 1200px;
            margin: 0 auto;
        }

        .testimonials-content h2 {
            text-align: center;
            font-size: 36px;
            margin-bottom: 40px;
        }

        .testimonial-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            border-left: 4px solid #25d366;
            backdrop-filter: blur(10px);
        }

        .testimonial-card p {
            margin-bottom: 15px;
            font-style: italic;
        }

        .testimonial-card .author {
            font-weight: 600;
            opacity: 0.9;
        }

        .price-section {
            background: white;
            padding: 60px 20px;
            text-align: center;
        }

        .price-section h2 {
            font-size: 36px;
            margin-bottom: 30px;
        }

        .price-display {
            font-size: 56px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 30px;
        }

        .price-section .cta-btn {
            padding: 18px 50px;
            font-size: 18px;
        }

        footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 20px;
            margin-top: 60px;
        }

        @media (max-width: 768px) {
            .hero-content,
            .cta-section {
                grid-template-columns: 1fr;
            }

            .hero-text h1 {
                font-size: 32px;
            }

            .benefits-grid {
                grid-template-columns: 1fr;
            }

            .price-display {
                font-size: 36px;
            }

            header nav {
                flex-direction: column;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <header>
        <nav>
            <div class="logo">${productName}</div>
            <a href="https://wa.me/${whatsapp}?text=Halo! Saya tertarik dengan ${productName}" target="_blank" class="wa-link">
                💬 Chat WhatsApp
            </a>
        </nav>
    </header>

    <section class="hero">
        <div class="hero-content">
            <div class="hero-text">
                <h1>${data.headline}</h1>
                <p>${data.subheadline}</p>
                <p>${data.description}</p>
                <div class="cta-section">
                    <a href="https://wa.me/${whatsapp}?text=Halo! Saya ingin memesan ${productName}" target="_blank" class="cta-btn cta-primary">
                        ✅ ${data.cta || 'Pesan Sekarang'}
                    </a>
                    <button class="cta-btn cta-secondary" onclick="document.querySelector('.benefits').scrollIntoView({behavior: 'smooth'})">
                        📖 Lihat Detail
                    </button>
                </div>
            </div>
            <div class="hero-image">
                <img src="${imageUrl}" alt="${productName}" />
            </div>
        </div>
    </section>

    <section class="benefits">
        <div class="benefits-content">
            <h2>Mengapa Memilih Kami?</h2>
            <div class="benefits-grid">
                ${(data.benefits || ['Kualitas Premium', 'Harga Terjangkau', 'Layanan Terbaik']).map(benefit => `
                <div class="benefit-card">
                    <h3>✨ ${benefit}</h3>
                    <p>${benefit} yang kami tawarkan telah dipercaya ribuan pelanggan.</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section class="price-section">
        <h2>Harga Spesial Untuk Anda</h2>
        <div class="price-display">${data.price || 'IDR ' + document.getElementById('productPrice').value}</div>
        <a href="https://wa.me/${whatsapp}?text=Halo! Saya ingin memesan ${productName} dengan harga ${data.price || document.getElementById('productPrice').value}" target="_blank" class="cta-btn cta-primary">
            🛍️ ${data.cta || 'Pesan Sekarang'}
        </a>
    </section>

    <section class="testimonials">
        <div class="testimonials-content">
            <h2>Kepuasan Pelanggan Kami</h2>
            <div class="testimonial-card">
                <p>"${data.testimonial || 'Produk ini sangat berkualitas dan sesuai dengan ekspektasi saya. Highly recommended!'}"</p>
                <div class="author">- Pelanggan Setia ⭐⭐⭐⭐⭐</div>
            </div>
        </div>
    </section>

    <footer>
        <p>© 2024 BikinLaris - AI Digital Rebranding untuk UMKM Indonesia</p>
        <p>Powered by Gemini AI ✨</p>
    </footer>
</body>
</html>
        `;
    }

    // Helper: Convert to slug
    function toSlug(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
});

// Global function: Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Copied to clipboard!');
    }).catch(() => {
        alert('❌ Failed to copy');
    });
}

