/**
 * Retry helper with exponential backoff
 * Provides robust error handling for external API calls
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Execute a function with exponential backoff retry logic
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise with the result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delayMs = Math.min(
          initialDelayMs * Math.pow(backoffMultiplier, attempt),
          maxDelayMs
        );

        console.warn(
          `[Retry] Attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}. Retrying in ${delayMs}ms...`
        );

        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }

        await sleep(delayMs);
      }
    }
  }

  console.error(
    `[Retry] All ${maxRetries} retry attempts failed. Last error: ${lastError?.message}`
  );
  throw lastError;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (network errors, timeouts, rate limits)
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
    return true;
  }

  // HTTP status codes that are retryable
  if (error.response) {
    const status = error.response.status;
    return status === 429 || status === 503 || status === 504 || status >= 500;
  }

  return false;
}

/**
 * Wrapper for HTTP requests with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.response = response;
      throw error;
    }

    return response;
  }, retryOptions);
}
