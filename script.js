Papa.parse('musicrevenue.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(results) {
        console.log("CSV data loaded successfully");
        console.log(results.data);

        const tbody = document.querySelector('#dataTable tbody');

        const platforms = [];
        const payouts = [];

        results.data.forEach(row => {
            // Create table row
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

            // Collect data for the chart
            const payout = Number(row.PayoutPerStreamUSD);

            if (row.Platform && Number.isFinite(payout)) {
                platforms.push(row.Platform);
                payouts.push(payout);
            }
        });

        // Create bar chart
        const ctx = document.getElementById('revenueChart');

        new Chart(ctx, {
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
    },

    error: function(err) {
        console.error("Failed to load CSV:", err);
    }
});
