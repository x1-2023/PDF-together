/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-cream': 'var(--color-bg-cream)',
                'text-dark': 'var(--color-text-dark)',
                'text-light': 'var(--color-text-light)',
                'accent-orange': 'var(--color-accent-orange)',
                'gray-50': 'var(--color-gray-50)',
                'gray-100': 'var(--color-gray-100)',
                'gray-200': 'var(--color-gray-200)',
                'gray-300': 'var(--color-gray-300)',
            },
            fontFamily: {
                'sans': ['Inter', 'sans-serif'],
                'display': ['Merriweather', 'serif'],
            },
            borderRadius: {
                'sm': 'var(--radius-sm)',
                'md': 'var(--radius-md)',
                'lg': 'var(--radius-lg)',
                'full': 'var(--radius-full)',
            }
        },
    },
    plugins: [],
}
