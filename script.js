let allData = [];
let revenueChart;

const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const sortOrder = document.getElementById('sortOrder');
const resetButton = document.getElementById('resetButton');
const resultCount = document.getElementById('resultCount');
const tableBody = document.querySelector('#dataTable tbody');
const chartCanvas = document.getElementById('revenueChart');
const chartMessage = document.getElementById('chartMessage');

// Load the CSV file
Papa.parse('musicrevenue.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(results) {
        allData = results.data.filter(row =>
            row.Platform &&
            row.PayoutPerStreamUSD !== '' &&
            Number.isFinite(Number(row.PayoutPerStreamUSD))
        );

        console.log('Data loaded:', allData);
        updateDashboard();
    },

    error: function(error) {
        console.error('Error loading CSV:', error);
        resultCount.textContent = 'Could not load the data.';
    }
});

// Search, filter and sort
searchInput.addEventListener('input', updateDashboard);
typeFilter.addEventListener('change', updateDashboard);
sortOrder.addEventListener('change', updateDashboard);

resetButton.addEventListener('click', function() {
    searchInput.value = '';
    typeFilter.value = 'all';
    sortOrder.value = 'default';

    updateDashboard();
});

function updateDashboard() {
    const search = searchInput.value.toLowerCase().trim();
    const type = typeFilter.value;
    const sort = sortOrder.value;

    let data = allData.filter(row => {
        const matchesName = row.Platform.toLowerCase().includes(search);
        const matchesType = type === 'all' || row.Type === type;

        return matchesName && matchesType;
    });

    if (sort === 'high') {
        data.sort((a, b) =>
            Number(b.PayoutPerStreamUSD) - Number(a.PayoutPerStreamUSD)
        );
    } else if (sort === 'low') {
        data.sort((a, b) =>
            Number(a.PayoutPerStreamUSD) - Number(b.PayoutPerStreamUSD)
        );
    }

    resultCount.textContent =
        `Showing ${data.length} of ${allData.length} platforms`;

    updateTable(data);
    updateChart(data);
}

// Display the table
function updateTable(data) {
    tableBody.innerHTML = '';

    if (data.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 5;
        cell.textContent = 'No matching platforms found.';
        cell.className = 'empty-message';

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    data.forEach(platform => {
        const row = document.createElement('tr');

        const values = [
            platform.Platform,
            platform.PayoutPerStreamUSD,
            platform.MonthlyUsersMillions,
            platform.Type,
            platform.StreamsForUSMonthlyMinimumWage
        ];

        values.forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value ?? '';
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// Display the bar chart
function updateChart(data) {
    const names = data.map(row => row.Platform);

    const payouts = data.map(row =>
        Number(row.PayoutPerStreamUSD)
    );

    if (data.length === 0) {
        chartCanvas.hidden = true;
        chartMessage.hidden = false;
        return;
    }

    chartCanvas.hidden = false;
    chartMessage.hidden = true;

    if (revenueChart) {
        revenueChart.data.labels = names;
        revenueChart.data.datasets[0].data = payouts;
        revenueChart.update();
        return;
    }

    revenueChart = new Chart(chartCanvas, {
        type: 'bar',

        data: {
            labels: names,
            datasets: [{
                label: 'Payout per Stream (USD)',
                data: payouts,
                backgroundColor: '#8272c9',
                borderColor: '#55458e',
                borderWidth: 1,
                borderRadius: 4
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' +
                                context.parsed.y.toFixed(4) +
                                ' per stream';
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Payout per Stream (USD)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Music Platform'
                    }
                }
            }
        }
    });
}
