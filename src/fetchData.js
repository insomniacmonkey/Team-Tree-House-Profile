const axios = require('axios');

const url = 'https://teamtreehouse.com/profiles/chansestrode.json';

async function fetchData() {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return null;
  }
}

module.exports = fetchData;
