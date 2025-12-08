/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary: SEDONA (CMYK: 8,75,82,1) #DE623F
        primary: {
          50: "#fef5f3",
          100: "#fde8e2",
          200: "#fbd5ca",
          300: "#f7b5a5",
          400: "#f28d73",
          500: "#DE623F", // Base color
          600: "#c94d2a",
          700: "#a73d22",
          800: "#8a3420",
          900: "#723020",
          950: "#3d160f",
        },
        // Secondary: CHOCOLATE (CMYK: 36,82,100,50) #652B10
        secondary: {
          50: "#faf6f3",
          100: "#f4ebe0",
          200: "#e7d4c1",
          300: "#d4b699",
          400: "#bd9169",
          500: "#652B10", // Base color
          600: "#5a250e",
          700: "#4c1f0c",
          800: "#401a0a",
          900: "#361609",
          950: "#1c0b04",
        },
        // Accent 1: YELLOW (CMYK: 5,34,100,0) #EFAE1E
        accent1: {
          50: "#fefbf3",
          100: "#fdf6e1",
          200: "#faebc0",
          300: "#f6da8f",
          400: "#f1c45c",
          500: "#EFAE1E", // Base color
          600: "#d9950f",
          700: "#b4730d",
          800: "#925b12",
          900: "#784c12",
          950: "#452707",
        },
        // Accent 2: BALLET (CMYK: 0,20,15,0) #FCD3C9
        accent2: {
          50: "#fef8f7",
          100: "#fdf0ed",
          200: "#fbe0d9",
          300: "#f7c8bb",
          400: "#FCD3C9", // Base color
          500: "#f4a896",
          600: "#e87d66",
          700: "#d45f45",
          800: "#b04f3a",
          900: "#924633",
          950: "#4e2118",
        },
        // Charcoal (CMYK: 65,65,59,53) #3E3739
        charcoal: {
          50: "#f7f6f6",
          100: "#edecec",
          200: "#d8d6d7",
          300: "#b9b5b7",
          400: "#948e91",
          500: "#3E3739", // Base color
          600: "#342e30",
          700: "#2b2628",
          800: "#242021",
          900: "#1f1c1d",
          950: "#0f0d0e",
        },
        // Cream (CMYK: 2,2,8,0) #F8F4E9
        cream: {
          50: "#F8F4E9", // Base color
          100: "#f5f0e0",
          200: "#eae2c1",
          300: "#ddcf9a",
          400: "#ceb86f",
          500: "#c0a04a",
          600: "#a8873d",
          700: "#8a6a34",
          800: "#71562f",
          900: "#5f4829",
          950: "#352515",
        },
      },
    },
  },
  plugins: [],
};
