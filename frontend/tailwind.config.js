/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Typography: 4 sizes, 2 weights only
      fontSize: {
        'size-1': ['2rem', { lineHeight: '2.5rem', fontWeight: '600' }],      // Large headings - Semibold
        'size-2': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],  // Subheadings - Semibold  
        'size-3': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],      // Body text - Regular
        'size-4': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }], // Small text - Regular
      },
      fontWeight: {
        'regular': '400',
        'semibold': '600',
      },
      // 8pt Grid System - all spacing divisible by 8 or 4
      spacing: {
        '1': '4px',   // 4px
        '2': '8px',   // 8px
        '3': '12px',  // 12px
        '4': '16px',  // 16px
        '6': '24px',  // 24px
        '8': '32px',  // 32px
        '10': '40px', // 40px
        '12': '48px', // 48px
        '16': '64px', // 64px
        '20': '80px', // 80px
        '24': '96px', // 96px
      },
      // Container queries support
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      // Border radius using CSS custom properties
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Animation keyframes for accordions
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    // Remove tailwindcss-animate as it's built-in to v4
  ],
}