/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0a0a0b",
                card: "rgba(255, 255, 255, 0.05)",
                primary: "#3b82f6",
                accent: "#a855f7",
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
