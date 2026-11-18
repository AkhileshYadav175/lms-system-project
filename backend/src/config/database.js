import mongoose from 'mongoose';

const connectToDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Please define the MONGODB_URI environment variable");

    if (mongoose.connection.readyState >= 1) {
      return mongoose.connection;
    }
    
    await mongoose.connect(uri, {
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4, // Use IPv4, skip IPv6 resolution delays
    });
    console.log("MongoDB Connected (Connection pool: min 10, max 50)");
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectToDatabase;
