import type {
  NavigatorContact,
  NavigatorEvent,
  NavigatorRelatedResource,
  NavigatorResponse,
  NavigatorSource,
} from "@/lib/navigator/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isDeAnzaUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;

  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      (url.hostname === "deanza.edu" || url.hostname.endsWith(".deanza.edu"))
    );
  } catch {
    return false;
  }
}

function parseEvent(value: unknown): NavigatorEvent | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  if (
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.location_text)
  ) {
    return undefined;
  }
  if (
    (value.start !== null && typeof value.start !== "string") ||
    (value.end !== null && typeof value.end !== "string")
  ) {
    return undefined;
  }

  return {
    title: value.title,
    start: value.start,
    end: value.end,
    location_text: value.location_text,
  };
}

function parseContact(value: unknown): NavigatorContact | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  if (!isNonEmptyString(value.name) || !isNonEmptyString(value.email)) {
    return undefined;
  }

  return { name: value.name, email: value.email };
}

function stripCodeFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function extractJson(content: unknown): unknown {
  if (!Array.isArray(content)) return null;

  const texts = content
    .filter(
      (block): block is { type: "text"; text: string } =>
        isRecord(block) &&
        block.type === "text" &&
        typeof block.text === "string",
    )
    .map((block) => block.text);

  // Citations can split one reply into several text blocks, so try them
  // joined first, then the last block alone, then joined with newlines.
  const candidates = [
    texts.join(""),
    texts[texts.length - 1] ?? "",
    texts.join("\n"),
  ];

  for (const candidate of candidates) {
    const cleaned = stripCodeFences(candidate);
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) continue;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      // try the next candidate
    }
  }
  return null;
}
function cleanText(value: string): string {
  return value
    .replace(/\(?<?\/?\s*(?:antml:)?cite\b[^>]*>/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
export function validateNavigatorResponse(
  content: unknown,
): NavigatorResponse | null {
  const value = extractJson(content);
  if (!value) return null;

  if (
    !isRecord(value) ||
    !isNonEmptyString(value.answer) ||
    !Array.isArray(value.steps) ||
    !value.steps.every(isNonEmptyString) ||
    !Array.isArray(value.related) ||
    !Array.isArray(value.sources) ||
    !["high", "medium", "low"].includes(value.confidence as string)
  ) {
    return null;
  }

  const event = parseEvent(value.event);
  const contact = parseContact(value.contact);
  if (event === undefined || contact === undefined) return null;

  const relatedTitles = new Set<string>();
  const related: NavigatorRelatedResource[] = [];
  for (const item of value.related) {
    if (
      !isRecord(item) ||
      !isNonEmptyString(item.title) ||
      !isNonEmptyString(item.query)
    ) {
      continue;
    }

    const titleKey = item.title.toLocaleLowerCase();
    if (relatedTitles.has(titleKey) || related.length === 4) continue;
    relatedTitles.add(titleKey);
    related.push({
      title: item.title,
      query: item.query,
      ...(isDeAnzaUrl(item.url) ? { url: item.url } : {}),
    });
  }

  const sources: NavigatorSource[] = [];
  for (const item of value.sources) {
    if (
      !isRecord(item) ||
      !isNonEmptyString(item.title) ||
      !isDeAnzaUrl(item.url)
    ) {
      continue;
    }
    sources.push({ title: item.title, url: item.url });
  }

  return {
    answer: value.answer,
    steps: value.steps.slice(0, 6),
    related,
    event,
    sources,
    confidence: value.confidence as NavigatorResponse["confidence"],
    contact,
  };
}
