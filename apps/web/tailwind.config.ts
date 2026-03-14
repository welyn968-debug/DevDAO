import base from "@devdao/config/tailwind";
import type { Config } from "tailwindcss";

const config: Config = {
  presets: [base],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class"
};

export default config;
