/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "background": "#0a0a0b",
                "card": "rgba(255, 255, 255, 0.05)",
                "primary": "#1111d4",
                "primary-light": "#3b3bff",
                "background-light": "#f6f6f8",
                "background-dark": "#101022",
                "agent-blue": "#3b82f6",
                "agent-green": "#10b981",
                "agent-gold": "#f59e0b",
                "accent": "#a855f7",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "3xl": "1.5rem",
                "full": "9999px"
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
