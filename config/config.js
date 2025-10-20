import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const config = {
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  WEATHER_API_KEY: process.env.WEATHER_API_KEY,
};

export default config;
