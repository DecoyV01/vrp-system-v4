/**
 * Rate limiter for API calls
 * Implements token bucket algorithm
 */
export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per millisecond

  constructor(maxRequestsPerMinute: number) {
    this.maxTokens = maxRequestsPerMinute
    this.tokens = maxRequestsPerMinute
    this.lastRefill = Date.now()
    this.refillRate = maxRequestsPerMinute / (60 * 1000) // tokens per millisecond
  }

  /**
   * Check if a request can be made and consume a token if available
   */
  async canMakeRequest(): Promise<boolean> {
    this.refillTokens()

    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }

    return false
  }

  /**
   * Wait until a token is available
   */
  async waitForToken(): Promise<void> {
    this.refillTokens()

    if (this.tokens >= 1) {
      this.tokens -= 1
      return
    }

    // Calculate wait time until next token is available
    const tokensNeeded = 1 - this.tokens
    const waitTime = tokensNeeded / this.refillRate

    await new Promise(resolve => setTimeout(resolve, Math.ceil(waitTime)))
    await this.waitForToken() // Recursive call to ensure token is available
  }

  /**
   * Get current token count and time until next refill
   */
  getStatus(): { tokens: number; timeUntilRefill: number } {
    this.refillTokens()

    const timeUntilRefill =
      this.tokens >= this.maxTokens
        ? 0
        : (this.maxTokens - this.tokens) / this.refillRate

    return {
      tokens: Math.floor(this.tokens),
      timeUntilRefill: Math.ceil(timeUntilRefill),
    }
  }

  private refillTokens(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = timePassed * this.refillRate

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
}
