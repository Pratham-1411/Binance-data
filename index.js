class BinanceChart {
    constructor() {
        this.chart = null;
        this.ws = null;
        this.coin = localStorage.getItem('selectedCoin') || 'ethusdt';
        this.interval = localStorage.getItem('selectedInterval') || '1m';
        this.chartData = this.initializeChartData();
        this.ctx = document.getElementById('myChart').getContext('2d');
        
        this.setupEventListeners();
        this.loadChartData();
        this.connectWebSocket();
    }

    // Initializes an empty chart dataset
    initializeChartData() {
        return {
            labels: [],
            datasets: [{
                label: 'Price',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1,
                fill: true
            }]
        };
    }

    // Function to determine time unit and step size based on interval
    getTimeConfig() {
        switch (this.interval) {
            case '1m': return { unit: 'minute', stepSize: 1 };
            case '3m': return { unit: 'minute', stepSize: 3 };
            case '5m': return { unit: 'minute', stepSize: 5 };
            case '15m': return { unit: 'minute', stepSize: 15 };
            case '30m': return { unit: 'minute', stepSize: 30 };
            case '1h': return { unit: 'hour', stepSize: 1 };
            case '4h': return { unit: 'hour', stepSize: 4 };
            default: return { unit: 'minute', stepSize: 1 };
        }
    }

    // Initializes the chart with empty data
    initializeChart() {
        if (this.chart) this.chart.destroy(); // Destroy existing chart to avoid duplication
        const { unit, stepSize } = this.getTimeConfig();

        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: this.chartData,
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: unit,
                            tooltipFormat: 'MMM d, h:mm a',  // Corrected 'D' to 'd'
                            displayFormats: {
                                minute: 'MMM d, h:mm a',
                                hour: 'MMM d, h:mm a'
                            }
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 20,
                            stepSize: stepSize // Set step size based on interval
                        }
                    },
                    y: {
                        beginAtZero: false
                    }
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x'
                        },
                        zoom: {
                            wheel: {
                                enabled: true // Enable zoom on wheel scroll
                            },
                            pinch: {
                                enabled: true // Enable zoom on pinch for touch devices
                            },
                            mode: 'x'
                        }
                    }
                }
            }
        });
    }

    // Connects to Binance WebSocket
    connectWebSocket() {
        if (this.ws) this.ws.close(); // Close any existing WebSocket connection
        const socketUrl = `wss://stream.binance.com:9443/ws/${this.coin}@kline_${this.interval}`;
        this.ws = new WebSocket(socketUrl);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const candlestick = data.k;
            const time = new Date(candlestick.t);
            const closePrice = parseFloat(candlestick.c);

            // Append new data to chart smoothly
            this.updateChartData(time, closePrice);
        };

        this.ws.onclose = () => {
            console.log('WebSocket closed. Reconnecting...');
            this.connectWebSocket();
        };
    }

    // Updates chart data smoothly without flickering
    updateChartData(time, closePrice) {
        this.chartData.labels.push(time);
        this.chartData.datasets[0].data.push(closePrice);
        
        if (this.chartData.labels.length > 100) {
            this.chartData.labels.shift();
            this.chartData.datasets[0].data.shift();
        }
        
        this.chart.update('none'); // 'none' avoids animation flicker
    }

    // Loads stored chart data from localStorage
    loadChartData() {
        const storedData = localStorage.getItem(`${this.coin}_${this.interval}_data`);
        if (storedData) {
            this.chartData = JSON.parse(storedData);
        } else {
            this.chartData = this.initializeChartData();
        }
        this.initializeChart();
    }

    // Sets up event listeners for user interactions
    setupEventListeners() {
        document.getElementById('coinSelect').value = this.coin;
        document.getElementById('coinSelect').addEventListener('change', (event) => {
            this.coin = event.target.value;
            localStorage.setItem('selectedCoin', this.coin);
            this.loadChartData();
            this.connectWebSocket();
        });

        document.getElementById('intervalSelect').value = this.interval;
        document.getElementById('intervalSelect').addEventListener('change', (event) => {
            this.interval = event.target.value;
            localStorage.setItem('selectedInterval', this.interval);
            this.loadChartData();
            this.connectWebSocket();
        });
    }
}

// Initialize the BinanceChart class
const binanceChart = new BinanceChart();
