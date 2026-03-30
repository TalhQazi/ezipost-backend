const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = 5000;
const MONGO_URI = "mongodb+srv://sadhana:sadhana123@cluster0.je0urmy.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Manual Startup: Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Manual Startup: Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Manual Startup: Failed', err.message);
  });
