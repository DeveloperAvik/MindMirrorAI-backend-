// src/server.ts
import mongoose from "mongoose";
import app from "./app";
import { ENV } from "./App/Config/env";

const PORT = ENV.PORT || 4000;

async function start() {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.warn("⚠️ Could not connect to MongoDB:", (err as Error).message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("Failed to start:", err);
  process.exit(1);
});
