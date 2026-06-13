import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  try {
    console.log("Connecting to MongoDB:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
}
check();
