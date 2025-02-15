const { JSONFileSync, LowSync } = require('lowdb');

// Set up database
const adapter = new JSONFileSync('./data/points.json');
const db = new LowSync(adapter);

// Default data structure
db.read();
db.data ||= { lastRecorded: 0, history: [] };
db.write();

function trackPoints(data) {
  const { points } = data;
  const lastRecorded = db.data.lastRecorded;

  if (points.total > lastRecorded) {
    console.log(`New points earned: ${points.total - lastRecorded}`);
    db.data.history.push({ date: new Date().toISOString(), points: points.total });
    db.data.lastRecorded = points.total;
    db.write();
  } else {
    console.log('No new points earned today.');
  }
}

module.exports = trackPoints;
