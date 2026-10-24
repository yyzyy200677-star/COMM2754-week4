let allData = [];
let revenueChart = null;

// Load CSV data
Papa.parse('musicrevenue.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(results) {
        if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
        }

        allData = results.data.filter(row => {
            return row.Platform &&
                Number.isFinite(Number(row.PayoutPerStreamUSD));
        });

        console.log('CSV data loaded successfully');
        console.log(allData);

        // Display all data when the page first loads
        updateDashboard();
    },

    error: function(error) {
        console.error('Failed to load CSV:', error);

        document.getElementById('resultCount').textContent =
            'Unable to load data. Please refresh the page.';
    }
});

// Connect the controls
document.getElementById('searchInput').addEventListener('input', updateDashboard);

document.getElementById('typeFilter').addEventListener('change', updateDashboard);

document.getElementById('sortOrder').addEventListener('change', updateDashboard);

document.getElementById('resetButton').addEventListener('click', function() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = 'all';
    document.getElementById('sortOrder').value = 'default';

    updateDashboard();
});

// Filter and sort data
function updateDashboard() {
    const searchText = document.getElementById('searchInput')
        .value.toLowerCase().trim();

    const selectedType = document.getElementById('typeFilter').value;

    const sortOrder = document.getElementById('sortOrder').value;

    let filteredData = allData.filter(row => {
        const platformName = row.Platform.toLowerCase();

        const matchesSearch = platformName.includes(searchText);

        const matchesType = selectedType === 'all' ||
            row.Type === selectedType;

        return matchesSearch && matchesType;
    });

    if (sortOrder === 'high') {
        filteredData.sort((a, b) =>
            Number(b.PayoutPerStreamUSD) -
            Number(a.PayoutPerStreamUSD)
        );
    }

    if (sortOrder === 'low') {
        filteredData.sort((a, b) =>
            Number(a.PayoutPerStreamUSD) -
            Number(b.PayoutPerStreamUSD)
        );
    }

    updateTable(filteredData);
    updateChart(filteredData);

    document.getElementById('resultCount').textContent =
        `Showing ${filteredData.length} of ${allData.length} platforms`;
}

// Update HTML table
function updateTable(data) {
    const tbody = document.querySelector('#dataTable tbody');

    tbody.innerHTML = '';

    if (data.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');

        td.colSpan = 5;
        td.textContent = 'No matching platforms found.';
        td.style.textAlign = 'center';

        tr.appendChild(td);
        tbody.appendChild(tr);

        return;
    }

    data.forEach(row => {
        const tr = document.createElement('tr');

        const values = [
            row.Platform,
            row.PayoutPerStreamUSD,
            row.MonthlyUsersMillions,
            row.Type,
            row.StreamsForUSMonthlyMinimumWage
        ];

        values.forEach(value => {
            const td = document.createElement('td');

            td.textContent = value ?? '';

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// Update Chart.js bar chart
function updateChart(data) {
    const platforms = data.map(row => row.Platform);

    const payouts = data.map(row =>
        Number(row.PayoutPerStreamUSD)
    );

    // Update the existing chart
    if (revenueChart !== null) {
        revenueChart.data.labels = platforms;
        revenueChart.data.datasets[0].data = payouts;
        revenueChart.update();

        return;
    }

    // Create the chart for the first time
    const canvas = document.getElementById('revenueChart');

    revenueChart = new Chart(canvas, {
        type: 'bar',

        data: {
            labels: platforms,

            datasets: [{
                label: 'Payout per Stream (USD)',
                data: payouts,
                backgroundColor: '#7766cc',
                borderColor: '#403a78',
                borderWidth: 1,
                borderRadius: 5
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
                        text: 'Music Streaming Platform'
                    }
                }
            }
        }
    });
}
