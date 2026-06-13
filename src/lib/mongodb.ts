import mongoose from 'mongoose';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/atomquest";
  
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    console.log("[DB] Connecting to MongoDB...");
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log(`[DB] Successfully connected to: ${MONGODB_URI.split('@')[1] || MONGODB_URI}`);
      return mongoose;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
