
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testMicrosite() {
    console.log('Testing /api/microsite...');
    try {
        const response = await fetch('http://localhost:3000/api/microsite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productName: 'Test Product',
                price: '100000',
                whatsapp: '628123456789',
                imageUrl: ''
            })
        });
        const data = await response.json();
        console.log('Microsite Response:', data);
        if (data.headline && data.cta) {
            console.log('✅ Microsite Endpoint Passed');
        } else {
            console.error('❌ Microsite Endpoint Failed', data);
        }
    } catch (error) {
        console.error('❌ Microsite Endpoint Error:', error.message);
    }
}

async function testProcess() {
    console.log('Testing /api/process...');
    try {
        const form = new FormData();
        // Use the generated test image
        const imagePath = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity', 'brain', '85fd6b08-c4c5-457a-a2a7-9d617765947e', 'test_product_coffee_1764676420009.png');

        if (!fs.existsSync(imagePath)) {
            console.error('Test image not found at:', imagePath);
            return;
        }

        form.append('image', fs.createReadStream(imagePath));
        form.append('productName', 'Kopi Emas');
        form.append('price', '50000');
        form.append('whatsapp', '628123456789');

        const response = await fetch('http://localhost:3000/api/process', {
            method: 'POST',
            body: form
        });
        const data = await response.json();
        console.log('Process Response:', data);
        if (data.description && data.caption) {
            console.log('✅ Process Endpoint Passed');
        } else {
            console.error('❌ Process Endpoint Failed', data);
        }
    } catch (error) {
        console.error('❌ Process Endpoint Error:', error.message);
    }
}

(async () => {
    await testMicrosite();
    await testProcess();
})();
