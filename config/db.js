const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Remove the deprecated options
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB connected successfully '.bold.bgYellow.blue);
  } catch (error) {
    console.error('MongoDB connection failed:'.cyan.bold , error.message.red);
    process.exit(1);
  }
};

module.exports = connectDB;
