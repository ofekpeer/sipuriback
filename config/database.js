import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export async function connectDatabase() {

    try {

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ MongoDB Connected");

    }

    catch (err) {

        console.error("❌ MongoDB Connection Error");

        console.error(err);

        process.exit(1);

    }

}