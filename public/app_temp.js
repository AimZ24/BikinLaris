document.addEventListener('DOMContentLoaded', () => {
    // ========== STATE MANAGEMENT ==========
    let currentHPPData = null;
    let currentBioHTML = null;
    let linkCounter = 0;

    // ========== HPP CALCULATOR ==========
    const hppForm = document.getElementById('hppCalculatorForm');
    const resultSection = document.getElementById('resultSection');

    hppForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const productName = document.getElementById('productName').value;
        const bahanBaku = parseFloat(document.getElementById('bahanBaku').value) || 0;
        const tenagaKerja = parseFloat(document.getElementById('tenagaKerja').value) || 0;
        const biayaLain = parseFloat(document.getElementById('biayaLain').value) || 0;

        const btn = hppForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Menghitung...';
        btn.disabled = true;

        resultSection.style.display = 'block';
        document.getElementById('priceRecommendation').innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Menganalisis harga kompetitor...</p>
            </div>
        `;
        resultSection.scrollIntoView({ behavior: 'smooth' });

        try {
            const response = await fetch('/api/calculate-hpp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName, bahanBaku, tenagaKerja, biayaLain })
            });

            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            currentHPPData = data;
            displayHPPResults(data);
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    function displayHPPResults(data) {
        document.getElementById('displayBahanBaku').textContent = `Rp ${data.hpp.bahanBaku.toLocaleString('id-ID')}`;
        document.getElementById('displayTenagaKerja').textContent = `Rp ${data.hpp.tenagaKerja.toLocaleString('id-ID')}`;
        document.getElementById('displayBiayaLain').textContent = `Rp ${data.hpp.biayaLain.toLocaleString('id-ID')}`;
        document.getElementById('displayHPP').textContent = `Rp ${data.hpp.total.toLocaleString('id-ID')}`;

        const rec = data.recommendation;
        const comp = data.competitorData;

        const priceHtml = `
            <div class="mb-4">
                <h4 class="text-success mb-3">
                    <i class="bi bi-star-fill me-2"></i>
                    Harga Jual Optimal: Rp ${rec.recommendedPrice.toLocaleString('id-ID')}
                </h4>
                <div class="alert alert-info">
                    <strong>Margin Profit:</strong> ${rec.profitMargin}%<br>
                    <strong>Profit per Unit:</strong> Rp ${(rec.recommendedPrice - data.hpp.total).toLocaleString('id-ID')}
                </div>
            </div>

            <div class="mb-4">
                <h5><i class="bi bi-lightbulb me-2"></i>Alasan:</h5>
                <p>${rec.reasoning}</p>
            </div>

            <div class="mb-4">
                <h5><i class="bi bi-bar-chart me-2"></i>Data Harga Kompetitor:</h5>
                <div class="alert alert-secondary">
                    <strong>Range Harga:</strong> ${comp.range}
                </div>
            </div>

            <div class="mb-4">
                <h5><i class="bi bi-calculator me-2"></i>Opsi Harga Alternatif:</h5>
                <div class="row g-2">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <small class="text-muted">Harga Minimum</small>
                                <div class="fw-bold">Rp ${rec.minPrice.toLocaleString('id-ID')}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <small class="text-muted">Harga Maximum</small>
                                <div class="fw-bold">Rp ${rec.maxPrice.toLocaleString('id-ID')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('priceRecommendation').innerHTML = priceHtml;
    }

    // One-Click Marketing
    const oneClickBtn = document.getElementById('oneClickMarketingBtn');
    if (oneClickBtn) {
        oneClickBtn.addEventListener('click', async () => {
            if (!currentHPPData) {
                alert('Silakan hitung HPP terlebih dahulu');
                return;
            }

            const productName = document.getElementById('productName').value;
            const rec = currentHPPData.recommendation;
            const marketingText = `💰 ${productName}\n\nHarga: Rp ${rec.recommendedPrice.toLocaleString('id-ID')}\n\nHPP: Rp ${currentHPPData.hpp.total.toLocaleString('id-ID')}\nMargin: ${rec.profitMargin}%\n\n${rec.reasoning}`;

            try {
                await navigator.clipboard.writeText(marketingText);
                alert('Marketing content copied to clipboard!');
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // ========== PRODUCT RECOMMENDATION ==========
    const recommendForm = document.getElementById('recommendForm');
    const recommendResults = document.getElementById('recommendResults');

    recommendForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const category = document.getElementById('category').value;
        const budget = parseFloat(document.getElementById('budget').value);
        const targetMarket = document.getElementById('targetMarket').value;
        const location = document.getElementById('location').value;

        const btn = recommendForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Menganalisis...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/recommend-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, budget, targetMarket, location })
            });

            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            displayRecommendations(data);
            recommendResults.style.display = 'block';
            recommendResults.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    function displayRecommendations(data) {
        const container = document.getElementById('recommendationsContainer');
        container.innerHTML = '';

        data.recommendations.forEach((product, index) => {
            const card = `
                <div class="card product-card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${index + 1}. ${product.productName}</h5>
                        <p class="card-text">${product.reasoning}</p>
                        <div class="row">
                            <div class="col-md-6">
                                <small class="text-muted">Estimasi HPP:</small>
                                <div class="fw-bold">Rp ${product.estimatedHPP.toLocaleString('id-ID')}</div>
                            </div>
                            <div class="col-md-6">
                                <small class="text-muted">Harga Jual Saran:</small>
                                <div class="fw-bold text-success">Rp ${product.suggestedPrice.toLocaleString('id-ID')}</div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <span class="badge bg-primary me-2">Demand: ${product.marketDemand}</span>
                            <span class="badge bg-warning me-2">Kompetisi: ${product.competitionLevel}</span>
                            <span class="badge bg-success">Profit: ${product.profitPotential}</span>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });

        document.getElementById('marketAnalysis').innerHTML = `<strong>Analisis Pasar:</strong> ${data.marketAnalysis}`;

        const tipsList = document.getElementById('tipsList');
        tipsList.innerHTML = '';
        data.tips.forEach(tip => {
            tipsList.innerHTML += `<li>${tip}</li>`;
        });
    }

    // ========== BIO WEBSITE GENERATOR ==========
    const bioForm = document.getElementById('bioForm');
    const bioPreview = document.getElementById('bioPreview');
    const linksContainer = document.getElementById('linksContainer');
    const addLinkBtn = document.getElementById('addLinkBtn');

    // Add initial link
    addLink();

    addLinkBtn.addEventListener('click', () => addLink());

    function addLink() {
        linkCounter++;
        const linkHtml = `
            <div class="link-item mb-3" data-link-id="${linkCounter}">
                <div class="row g-2">
                    <div class="col-md-4">
                        <input type="text" class="form-control link-title" placeholder="Judul Link" required>
                    </div>
                    <div class="col-md-4">
                        <input type="url" class="form-control link-url" placeholder="https://..." required>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select link-platform">
                            <option value="">Tanpa Icon</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="tiktok">TikTok</option>
                            <option value="youtube">YouTube</option>
                            <option value="shopee">Shopee</option>
                            <option value="tokopedia">Tokopedia</option>
                            <option value="website">Website</option>
                        </select>
                    </div>
                    <div class="col-md-1">
                        <button type="button" class="btn btn-danger btn-sm remove-link" data-link-id="${linkCounter}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        linksContainer.insertAdjacentHTML('beforeend', linkHtml);

        // Add remove handler
        const removeBtn = linksContainer.querySelector(`[data-link-id="${linkCounter}"] .remove-link`);
        removeBtn.addEventListener('click', function () {
            const linkId = this.getAttribute('data-link-id');
            const linkItem = linksContainer.querySelector(`.link-item[data-link-id="${linkId}"]`);
            if (linksContainer.querySelectorAll('.link-item').length > 1) {
                linkItem.remove();
            } else {
                const bgColor = document.getElementById('bgColor').value;
                const btnColor = document.getElementById('btnColor').value;
