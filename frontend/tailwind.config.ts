import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: "var(--bg-primary)",
                    secondary: "var(--bg-secondary)",
                    card: "var(--bg-card)",
                    "card-hover": "var(--bg-card-hover)",
                    input: "var(--bg-input)",
                },
                txt: {
                    primary: "var(--text-primary)",
                    secondary: "var(--text-secondary)",
                    muted: "var(--text-muted)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    hover: "var(--accent-hover)",
                    soft: "var(--accent-soft)",
                },
                border: {
                    DEFAULT: "var(--border)",
                    light: "var(--border-light)",
                },
            },
            borderRadius: {
                xl: "16px",
                "2xl": "20px",
            },
            animation: {
                "fade-in": "fadeIn 0.4s ease",
                "slide-up": "slideUp 0.4s ease",
                "slide-down": "slideDown 0.4s ease",
            },
        },
    },
    plugins: [],
};
export default config;
