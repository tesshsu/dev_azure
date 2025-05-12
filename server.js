const express = require('express');
const path = require('path');
const yahooFinance = require('yahoo-finance2').default;
const client = require('prom-client');
const { Kafka } = require('kafkajs');

const app = express();

// Enable metrics collection for default Node.js metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Create a custom counter metric for HTTP requests
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Middleware to count HTTP requests and send usage to Kafka
const kafka = new Kafka({
  clientId: 'stock-api-producer',
  brokers: ['9.163.161.131:9092'], // Replace with kafka LoadBalancer EXTERNAL-IP
});
const producer = kafka.producer();

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Establishes a connection to the Kafka producer.
 * Logs a success message upon successful connection.
 * Logs an error message if the connection attempt fails.
 */

/*******  4679df71-f81e-4420-9613-987dee178213  *******/
const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka Producer connected');
  } catch (error) {
    console.error('Failed to connect Kafka Producer:', error);
  }
};
connectProducer();

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.path}`);
  res.on('finish', async () => {
    const normalizedRoute = req.path.replace(/\/$/, '');
    console.log(`Request finished: ${req.method} ${normalizedRoute} ${res.statusCode}`);
    httpRequestCounter.inc({
      method: req.method,
      route: normalizedRoute,
      status: res.statusCode
    });
    // Send API usage data to Kafka
    try {
      await producer.send({
        topic: 'stock-api-usage',
        messages: [
          {
            value: JSON.stringify({
              method: req.method,
              route: normalizedRoute,
              status: res.statusCode,
              timestamp: new Date().toISOString(),
              userAgent: req.get('User-Agent')
            })
          }
        ]
      });
      console.log(`Sent API usage data to Kafka: ${req.method} ${normalizedRoute}`);
    } catch (error) {
      console.error('Failed to send API usage to Kafka:', error);
    }
  });
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API route for hello
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the API!' });
});

// API route to fetch top 20 U.S. stocks and send to Kafka
const topStocks = [
  "AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA", "BRK-B",
  "JPM", "V", "WMT", "MA", "PG", "UNH", "HD", "DIS", "PYPL", "NFLX",
  "ADBE", "CRM"
];

app.get('/api/stocks', async (req, res) => {
  try {
    const stockData = [];
    for (const symbol of topStocks) {
      try {
        const ticker = await yahooFinance.quote(symbol);
        const name = ticker.shortName || symbol;
        const price = ticker.regularMarketPrice || 'N/A';
        stockData.push({ symbol, name, price });
        console.log(`Fetched data for ${symbol}: ${price}`);

        // Send stock price to Kafka topic
        if (price !== 'N/A') {
          await producer.send({
            topic: 'stock-prices',
            messages: [
              { value: JSON.stringify({ symbol, price, timestamp: new Date().toISOString() }) }
            ],
          });
          console.log(`Sent ${symbol} price to Kafka`);
        }
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error.message);
        stockData.push({ symbol, name: symbol, price: 'N/A' });
      }
    }
    res.status(200).json(stockData);
  } catch (error) {
    console.error('Error in /api/stocks endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});