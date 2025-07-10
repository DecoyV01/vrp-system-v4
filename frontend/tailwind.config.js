/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  // Safelist for dynamic theme classes and design system utilities
  safelist: [
    // Theme switching attributes
    'data-theme',
    // Design system typography (only 4 sizes allowed)
    'text-sm',
    'text-base',
    'text-lg',
    'text-xl',
    // Design system font weights (only 2 allowed)
    'font-normal',
    'font-semibold',
    // 8pt grid spacing (only values divisible by 4)
    /^[pm]-(2|4|6|8|12|16|20|24)$/,
    /^gap-(2|4|6|8|12|16|20|24)$/,
    /^space-(2|4|6|8|12|16|20|24)$/,
    // Semantic color classes
    'bg-background',
    'bg-card',
    'bg-muted',
    'bg-primary',
    'bg-secondary',
    'text-foreground',
    'text-muted-foreground',
    'text-primary',
    'border',
    'border-primary',
  ],
  // Blocklist for forbidden utilities
  blocklist: [
    // Forbidden typography sizes
    'text-xs',
    'text-2xl',
    'text-3xl',
    'text-4xl',
    'text-5xl',
    'text-6xl',
    // Forbidden font weights
    'font-bold',
    'font-medium',
    'font-light',
    'font-thin',
    'font-black',
    'font-extrabold',
    // Forbidden spacing values (not divisible by 4)
    /^[pm]-(1|3|5|7|9|10|11|13|14|15|17|18|19|21|22|23)$/,
    /^gap-(1|3|5|7|9|10|11|13|14|15)$/,
    /^space-(1|3|5|7|9|10|11)$/,
    // Hardcoded color values (violates design system)
    /^bg-\[#.*\]$/,
    /^text-\[#.*\]$/,
    /^border-\[#.*\]$/,
  ],
  theme: {
    // Override default font sizes to enforce design system
    fontSize: {
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px - Small text, labels
      base: ['1rem', { lineHeight: '1.5rem' }], // 16px - Body text
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px - Subheadings
      xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px - Main headings
      // Remove all other sizes to enforce constraint
    },
    // Override default font weights to enforce design system
    fontWeight: {
      normal: '400', // Body text, regular content
      semibold: '600', // Headings, emphasis
      // Remove all other weights to enforce constraint
    },
    // Override default spacing to enforce 8pt grid
    spacing: {
      2: '0.5rem', // 8px
      4: '1rem', // 16px
      6: '1.5rem', // 24px
      8: '2rem', // 32px
      12: '3rem', // 48px
      16: '4rem', // 64px
      20: '5rem', // 80px
      24: '6rem', // 96px
      // Remove spacing values that don't follow 8pt grid
    },
    extend: {
      // Container queries support
      container: {
        center: true,
        padding: '2rem',
        screens: {
          '2xl': '1400px',
        },
      },
      // Border radius using CSS custom properties
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Animation keyframes for accordions
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    // Typography plugin for prose styling
    require('@tailwindcss/typography'),
  ],
}
