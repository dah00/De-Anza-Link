import { askNavigator } from "@/lib/navigator/ai";
import {
  findContact,
  findContactByEmail,
  getGeneralContact,
} from "@/lib/navigator/contacts";
import { getCampusMapUrl, matchBuilding } from "@/lib/navigator/buildings";
import type { NavigatorResponse } from "@/lib/navigator/types";

type NavigatorHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

function isHistoryMessage(value: unknown): value is NavigatorHistoryMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "role" in value &&
    (value.role === "user" || value.role === "assistant") &&
    "content" in value &&
    typeof value.content === "string" &&
    value.content.length < 1500
  );
}

function isHistory(value: unknown): value is NavigatorHistoryMessage[] {
  return (
    Array.isArray(value) && value.length <= 8 && value.every(isHistoryMessage)
  );
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please send a valid question." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "Please send a valid question." },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;
  if (typeof payload.question !== "string" || !payload.question.trim()) {
    return Response.json(
      { error: "Enter a question for Campus Navigator." },
      { status: 400 },
    );
  }

  const rawHistory = payload.history;
  if (!isHistory(rawHistory)) {
    return Response.json(
      { error: "Please send valid conversation history." },
      { status: 400 },
    );
  }

  const history = rawHistory;
  const question = payload.question.trim();
  const response: NavigatorResponse = await askNavigator(question, history);
  if (!response.event) {
    const building = matchBuilding(question) ?? matchBuilding(response.answer);
    response.location = building
      ? { name: building.name, mapUrl: getCampusMapUrl(building) }
      : null;
  }
  const topicsHint =
    response.confidence === "low"
      ? []
      : response.related.map((resource) => resource.title);
  const trustedContact = response.contact
    ? findContactByEmail(response.contact.email)
    : null;

  if (response.confidence === "low" || !trustedContact) {
    const fallbackContact =
      findContact(question, topicsHint) ?? getGeneralContact();
    response.contact = fallbackContact
      ? { name: fallbackContact.name, email: fallbackContact.email }
      : null;
  } else {
    response.contact = {
      name: trustedContact.name,
      email: trustedContact.email,
    };
  }

  return Response.json(response);
}
