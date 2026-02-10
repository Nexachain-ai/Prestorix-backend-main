const cron = require('node-cron');
const { getDailyROI } = require('../controllers/plan.controller');

cron.schedule('* * * * *', async () => {
  console.log("🚀 Running Daily ROI cron job at", new Date().toLocaleString());

  try {
    await getDailyROI(); 
  } catch (error) {
    console.error("❌ Cron job error:", error.message);
  }
});

