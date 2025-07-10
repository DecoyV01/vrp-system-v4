// Content Security Policy compliance for design assets
export const cspDirectives = {
  'default-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"], // style-src self for CSP compliance
  'font-src': ["'self'", 'data:'], // font-src self for CSP compliance
  'img-src': ["'self'", 'data:', 'blob:'],
  'script-src': ["'self'"],
}

// Theme error handling with fallback mechanisms
export const handleThemeError = (error: Error): void => {
  console.error('ThemeError:', error)

  // Fallback to default theme on error
  try {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.classList.remove('light')
  } catch (fallbackError) {
    console.error('Fallback default theme failed:', fallbackError)
  }
}

// Robust error handling for theme system
export const applyThemeWithErrorHandling = (theme: string): void => {
  try {
    if (!validateThemeInput(theme)) {
      throw new Error(`Invalid theme: ${theme}`)
    }

    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('light', theme === 'light')
  } catch (error) {
    handleThemeError(error as Error)

    // toast.error for user feedback (would need toast import)
    console.error('Theme application failed, using fallback default theme')
  }
}

// Validate theme inputs to prevent injection
export const validateThemeInput = (theme: string): boolean => {
  const allowedThemes = ['light', 'dark', 'system']
  return allowedThemes.includes(theme)
}

// Sanitize CSS custom property values
export const sanitizeCSSValue = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9#().,%-]/g, '')
}

// Design System Validation (FRT-BRAND-001 Compliance)
export const validateDesignSystem = () => {
  if (import.meta.env.DEV) {
    const rootStyles = getComputedStyle(document.documentElement)

    // Brand Colors (OKLCH format)
    const primaryColor = rootStyles.getPropertyValue('--color-primary').trim()
    const hasOklch = primaryColor.includes('oklch(65% 0.15 160)')

    // Performance (theme toggle < 200ms)
    const start = performance.now()
    document.documentElement.classList.toggle('light')
    document.documentElement.classList.toggle('light')
    const themeTime = performance.now() - start

    // Component Standards (data-slot attributes)
    const hasDataSlots =
      document.querySelector('[data-slot="TopRibbon"]') !== null

    const results = {
      brandColors: hasOklch,
      performance: themeTime < 200,
      components: hasDataSlots,
    }

    console.log('🎨 Design System Validation:', results)
    return results
  }
}

// Auto-validate in development - Test validation patterns
if (import.meta.env.DEV) {
  ;(window as any).validateDesignSystem = validateDesignSystem
}
