const fetchData = require('./fetchData');
const trackPoints = require('./trackPoints');

// Run once on startup
(async () => {
  const jsonData = await fetchData();
  if (jsonData) {
    trackPoints(jsonData);
  }
})();
