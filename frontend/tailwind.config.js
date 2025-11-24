/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#E8845B",        // Terracotta
                secondary: "#C8B162",      // Gold/Mustard
                background: {
                    light: "#FAF3E0",        // Warm Milky Yellow
                    DEFAULT: "#FAF3E0",
                    dark: "#1F1B16",
                },
                surface: {
                    light: "#FFFDF5",        // Very light cream
                    DEFAULT: "#FFFDF5",
                    dark: "#2A251F",
                },
                text: {
                    main: "#5D4037",         // Sepia/Dark Brown
                    muted: "#8D7B68",        // Muted Brown
                    light: "#4A443C",
                    dark: "#EAE0CC"
                },
                border: {
                    light: "#D3C5AA",        // Warm Beige Border
                    DEFAULT: "#EFEAE4",
                    dark: "#3C352B"
                },
                status: {
                    green: "#5A8B73",
                    yellow: "#F0A500",
                    gray: "#9E9486"
                }
            },
            fontFamily: {
                display: ["Lexend", "sans-serif"],
                body: ["Nunito", "sans-serif"],
                serif: ["Lora", "serif"],
            },
            boxShadow: {
                'soft': '0 4px 20px rgba(93, 64, 55, 0.05)',
                'float': '0 8px 24px rgba(93, 64, 55, 0.1)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
    ],
}
