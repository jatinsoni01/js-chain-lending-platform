const API_URL = 'https://api.coingecko.com/api/v3/coins/agoric';

async function fetchAgoricData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Populate market data
        document.getElementById('price').textContent = `$${data.market_data.current_price.usd.toFixed(2)}`;
        const priceChange = data.market_data.price_change_percentage_24h.toFixed(2);
        const priceChangeElement = document.getElementById('price-change');
        priceChangeElement.textContent = `Price Change (24h): ${priceChange}%`;
        priceChangeElement.className = priceChange >= 0 ? 'positive' : 'negative';
        document.getElementById('market-cap').textContent = data.market_data.market_cap.usd.toLocaleString();
        document.getElementById('volume').textContent = data.market_data.total_volume.usd.toLocaleString();
        document.getElementById('supply').textContent = data.market_data.circulating_supply.toLocaleString();

        // Populate historical data
        document.getElementById('price-change-24h').textContent = `${priceChange}%`;
        document.getElementById('market-cap-change').textContent = `$${data.market_data.market_cap_change_24h.toLocaleString()}`;
        document.getElementById('volume-change').textContent = `$${data.market_data.total_volume_change_24h.toLocaleString()}`;

        // Chart data (7 days)
        const prices = data.market_data.sparkline_7d.price;
        const labels = Array.from({ length: prices.length }, (_, i) => `${i + 1}h`);
        createPriceChart(labels, prices);
    } catch (error) {
        console.error('Error fetching Agoric market data:', error);
    }
}

function createPriceChart(labels, data) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Price (USD)',
                data,
                borderColor: '#0066ff',
                backgroundColor: 'rgba(0, 102, 255, 0.1)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (Hours)',
                        color: '#333',
                        font: {
                            size: 14,
                            weight: 'bold',
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price (USD)',
                        color: '#333',
                        font: {
                            size: 14,
                            weight: 'bold',
                        }
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Initialize
window.addEventListener('load', fetchAgoricData);