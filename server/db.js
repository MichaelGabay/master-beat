import mongoose from "mongoose"

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/masterbeat"

/**
 * @returns {Promise<void>}
 */
export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return

  await mongoose.connect(MONGODB_URI)
}
