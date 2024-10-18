import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [blockInfo, setBlockInfo] = useState(null);      // Detailed block information
  const [blockHeight, setBlockHeight] = useState(null);  // Block height
  const [btcPrice, setBtcPrice] = useState(null);        // Off-chain: Bitcoin price in USD
  const [btcMetrics, setBtcMetrics] = useState(null);    // Other off-chain metrics
  const [priceData, setPriceData] = useState(null);      // Price data for the chart
  const [fearGreedIndex, setFearGreedIndex] = useState(null);  // Fear and Greed Index
  const [error, setError] = useState('');

  const fetchLatestData = async () => {
    try {
      await fetchLatestBlockInfo();
      await fetchBtcMetrics();
      await fetchPriceData();
      await fetchFearGreedIndex();
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch latest Bitcoin block info (on-chain data from Blockchair API)
  const fetchLatestBlockInfo = async () => {
    try {
      const response = await fetch('https://api.blockchair.com/bitcoin/blocks?limit=1');
      if (!response.ok) throw new Error('Failed to fetch latest block info');
      const data = await response.json();
      
      const latestBlock = data.data[0];
      if (latestBlock) {
        setBlockHeight(latestBlock.id);
        setBlockInfo({
          hash: latestBlock.hash,
          size: latestBlock.size,
          difficulty: latestBlock.difficulty,
          totalVolume: latestBlock.weight,
        });
      } else {
        throw new Error('No latest block data found');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch Bitcoin price and other off-chain data (from CoinGecko)
  const fetchBtcMetrics = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false');
      if (!response.ok) throw new Error('Failed to fetch Bitcoin metrics');
      const data = await response.json();

      setBtcPrice(data.market_data.current_price.usd);
      setBtcMetrics({
        marketCap: data.market_data.market_cap.usd,
        volume24h: data.market_data.total_volume.usd,
        priceChange24h: data.market_data.price_change_percentage_24h,
        priceChange7d: data.market_data.price_change_percentage_7d,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch Bitcoin price data for the past 2 days from CoinGecko
  const fetchPriceData = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=2');
      if (!response.ok) throw new Error('Failed to fetch price data');
      const data = await response.json();

      const labels = data.prices.map(pricePoint => {
        const date = new Date(pricePoint[0]);
        return date.getHours() + ':00';
      });

      const prices = data.prices.map(pricePoint => pricePoint[1]);

      setPriceData({
        labels: labels.slice(-24),
        datasets: [
          {
            label: 'Bitcoin Price (USD)',
            data: prices.slice(-24),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
          },
        ],
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch the Fear and Greed Index from Alternative.me
  const fetchFearGreedIndex = async () => {
    try {
      const response = await fetch('https://api.alternative.me/fng/?limit=1');
      if (!response.ok) throw new Error('Failed to fetch Fear and Greed Index');
      const data = await response.json();
      const indexData = data.data[0];
      setFearGreedIndex({
        value: indexData.value,
        classification: indexData.value_classification,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Map Fear and Greed Index classification to corresponding emoji
  const getEmojiForClassification = (classification) => {
    switch (classification) {
      case 'Extreme Fear':
        return '🙀';
      case 'Fear':
        return '😨';
      case 'Neutral':
        return '😐';
      case 'Greed':
        return '🤑';
      case 'Extreme Greed':
        return '😈';
      default:
        return '';
    }
  };

  // Use `useEffect` to fetch data on component mount and auto-refresh
  useEffect(() => {
    fetchLatestData(); // Initial fetch
    const intervalId = setInterval(fetchLatestData, 60000); // Refresh every 60 seconds

    // Cleanup: Clear interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="app-container">
      <h1 className="title">Bitcoin Dashboard</h1>

      {/* Two-column layout */}
      <div className="dashboard-columns">
        <div className="column">
          {/* Display latest block height */}
          {blockHeight !== null ? (
            <div className="block-height">
              <h2>Block Height: {blockHeight}</h2>
            </div>
          ) : (
            <p>Loading block height...</p>
          )}

          {/* Display latest block information */}
          {blockInfo !== null ? (
            <div className="block-info">
              <h2>Latest Block Information</h2>
              <p>Block Hash: {blockInfo.hash}</p>
              <p>Block Size: {blockInfo.size} bytes</p>
              <p>Mining Difficulty: {blockInfo.difficulty}</p>
              <p>Total Transaction Volume (Weight): {blockInfo.totalVolume}</p>
            </div>
          ) : (
            <p>Loading latest block information...</p>
          )}

          {/* Display Bitcoin price and other off-chain data */}
          {btcPrice !== null ? (
            <div className="btc-metrics">
              <h2>Bitcoin Market Data</h2>
              <p>Bitcoin Price (USD): ${btcPrice}</p>
              <p>Market Cap: ${btcMetrics.marketCap?.toLocaleString()}</p>
              <p>24h Volume: ${btcMetrics.volume24h?.toLocaleString()}</p>
              <p>24h Price Change: {btcMetrics.priceChange24h}%</p>
              <p>7d Price Change: {btcMetrics.priceChange7d}%</p>
            </div>
          ) : (
            <p>Loading Bitcoin market data...</p>
          )}
        </div>

        <div className="column">
          {/* Display Fear and Greed Index */}
          {fearGreedIndex !== null ? (
            <div className="fear-greed-index">
              <h2>Fear and Greed Index {getEmojiForClassification(fearGreedIndex.classification)}</h2>
              <p>Current Index: {fearGreedIndex.value}</p>
              <p>Market Sentiment: {fearGreedIndex.classification}</p>
              
              {/* Progress bar for the index */}
              <div className="progress-bar">
                <progress max="100" value={fearGreedIndex.value}></progress>
              </div>
            </div>
          ) : (
            <p>Loading Fear and Greed Index...</p>
          )}

          {/* Display Bitcoin price chart */}
          {priceData ? (
            <div className="chart-container">
              <h2>Bitcoin Price - Last 24 Hours</h2>
              <Line
                data={priceData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: true, position: 'top' },
                    title: { display: true, text: 'Bitcoin Price in USD (Last 24 Hours)' },
                  },
                  scales: {
                    x: { title: { display: true, text: 'Time (Hourly)' } },
                    y: { title: { display: true, text: 'Price (USD)' } },
                  },
                }}
              />
            </div>
          ) : (
            <p>Loading Bitcoin price chart...</p>
          )}
        </div>
      </div>

      {/* Display any errors */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;
