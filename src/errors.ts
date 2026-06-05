type ErrorLikeRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ErrorLikeRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function collectMessages(value: unknown, seen: Set<unknown>): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    const normalized = normalizeWhitespace(value);
    return normalized ? [normalized] : [];
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return [String(value)];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  if (value instanceof Error) {
    return collectMessages(value.message, seen);
  }

  if (Array.isArray(value)) {
    const nested = value.flatMap((item) => collectMessages(item, seen));
    return Array.from(new Set(nested));
  }

  if (!isRecord(value)) {
    const normalized = normalizeWhitespace(String(value));
    return normalized ? [normalized] : [];
  }

  const priorityKeys = [
    "message",
    "error",
    "detail",
    "details",
    "reason",
    "description",
    "title",
    "msg",
  ];

  const messages: string[] = [];
  for (const key of priorityKeys) {
    if (key in value) {
      messages.push(...collectMessages(value[key], seen));
    }
  }

  if (messages.length > 0) {
    return Array.from(new Set(messages));
  }

  const nested = Object.values(value).flatMap((item) => collectMessages(item, seen));
  return Array.from(new Set(nested));
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const messages = collectMessages(error, new Set());
  if (messages.length === 0) {
    return fallback;
  }
  return messages.join("; ");
}
