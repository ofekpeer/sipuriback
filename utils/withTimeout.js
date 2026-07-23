export async function withTimeout(operation, { label, timeoutMs }) {
  const controller = new AbortController();
  const startedAt = Date.now();
  let timedOut = false;

  console.log(`[${label}] started (timeout: ${timeoutMs}ms)`);

  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operation(controller.signal), timeout]);
    console.log(`[${label}] completed in ${Date.now() - startedAt}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startedAt;
    const message = timedOut
      ? `${label} timed out after ${timeoutMs}ms`
      : `${label} failed after ${duration}ms: ${error.message}`;

    console.error(`[${label}] ${message}`);
    throw new Error(message, { cause: error });
  } finally {
    clearTimeout(timer);
  }
}
