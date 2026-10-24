let allData = [];
let revenueChart = null;

const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const sortOrder = document.getElementById('sortOrder');
const resetButton = document.getElementById('resetButton');

const resultCount = document.getElementById('resultCount');
const tableBody = document.querySelector('#dataTable tbody');
const chartCanvas = document.getElementById('revenueChart');
const chartMessage = document.getElementById('chartMessage');

// Load the CSV data
Papa.parse('musicrevenue.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(results) {
        allData = results.data.filter(row => {
            return row.Platform &&
                row.PayoutPerStreamUSD !== '' &&
                Number.isFinite(Number(row.PayoutPerStreamUSD));
        });

        console.log('CSV loaded:', allData);
        updateDashboard();
    },

    error: function(error) {
        console.error('Error loading CSV:', error);
        resultCount.textContent = 'Could not load the data.';
    }
});

// Filter controls
searchInput.addEventListener('input', updateDashboard);
typeFilter.addEventListener('change', updateDashboard);
sortOrder.addEventListener('change', updateDashboard);

resetButton.addEventListener('click', function() {
    searchInput.value = '';
    typeFilter.value = 'all';
    sortOrder.value = 'default';

    updateDashboard();
});

// Search, filter and sort data
function updateDashboard() {
    const search = searchInput.value.toLowerCase().trim();
    const selectedType = typeFilter.value;
    const selectedSort = sortOrder.value;

    let data = allData.filter(row => {
        const matchesSearch =
            row.Platform.toLowerCase().includes(search);

        const matchesType =
            selectedType === 'all' || row.Type === selectedType;

        return matchesSearch && matchesType;
    });

    if (selectedSort === 'high') {
        data.sort((a, b) =>
            Number(b.PayoutPerStreamUSD) -
            Number(a.PayoutPerStreamUSD)
        );
    } else if (selectedSort === 'low') {
        data.sort((a, b) =>
            Number(a.PayoutPerStreamUSD) -
            Number(b.PayoutPerStreamUSD)
        );
    }

    resultCount.textContent =
        `Showing ${data.length} of ${allData.length} platforms`;

    updateTable(data);
    updateChart(data);
}

// Update the table
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

// Update the chart
function updateChart(data) {
    const names = data.map(row => row.Platform);

    const payouts = data.map(row =>
        Number(row.PayoutPerStreamUSD)
    );

    if (data.length === 0) {
        chartCanvas.style.display = 'none';
        chartMessage.hidden = false;
        return;
    }

    chartCanvas.style.display = 'block';
    chartMessage.hidden = true;

    if (revenueChart !== null) {
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
                borderRadius: 4,

                maxBarThickness: 55,
                categoryPercentage: 0.75,
                barPercentage: 0.8
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
                    },

                    ticks: {
                        callback: function(value) {
                            return '$' + Number(value).toFixed(4);
                        }
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
