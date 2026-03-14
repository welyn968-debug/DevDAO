import colors from "tailwindcss/colors";
import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";

const preset = {
  theme: {
    extend: {
      colors: {
        primary: colors.indigo,
        accent: colors.emerald,
        neutral: colors.zinc
      },
      fontFamily: {
        display: ["Space Grotesk", "Inter", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [typography, forms]
};

export default preset;
