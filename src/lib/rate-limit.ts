// Rate limit simple en memoria: suficiente para un curso pequeño.
// En serverless cada instancia tiene su propio mapa, pero para este
// volumen (decenas de personas) es protección más que suficiente.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Devuelve true si la petición está permitida. */
export function rateLimit(key: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= max;
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
