export async function measureExecutionTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`Execution time of ${name}: ${(end - start).toFixed(2)} ms`);
    return result;
}