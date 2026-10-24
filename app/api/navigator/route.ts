import { askNavigator } from "@/lib/navigator/ai";
import {
  cacheKey,
  getSavedAnswer,
  saveAnswer,
} from "@/lib/navigator/answer-cache";
import {
  findContact,
  findContactByEmail,
  getGeneralContact,
} from "@/lib/navigator/contacts";
import { getCampusMapUrl, matchBuilding } from "@/lib/navigator/buildings";
import { createClient } from "@/lib/supabase/server";

const MAX_QUESTION_LENGTH = 500;

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
    return Response.json({ error: "Type a question first." }, { status: 400 });
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
  if (question.length > MAX_QUESTION_LENGTH) {
    return Response.json(
      { error: `Keep your question under ${MAX_QUESTION_LENGTH} characters.` },
      { status: 400 },
    );
  }

  // The proxy skips /api/*, so check the session here.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json(
      { error: "Log in to ask a question." },
      { status: 401 },
    );
  }

  // Every question counts, saved answers included. Counted before answering so
  // questions sent at the same time can't go over the limit.
  const { data: remaining, error: usageError } = await supabase.rpc(
    "use_navigator_question",
  );
  if (usageError) {
    if (usageError.message.includes("daily_limit_reached")) {
      return Response.json(
        {
          error: "You've used your 10 questions for today. Come back tomorrow.",
          remaining: 0,
        },
        { status: 429 },
      );
    }
    console.error("Campus Navigator usage check failed:", usageError.message);
    return Response.json(
      { error: "Couldn't look that up right now. Try again in a second." },
      { status: 500 },
    );
  }

  // Saved answers only for first questions: a follow-up like "what about
  // weekends?" depends on the earlier turns.
  const key = history.length === 0 ? cacheKey(question) : "";
  const saved = key ? getSavedAnswer(key) : null;
  if (saved) {
    return Response.json({ ...saved, remaining });
  }

  const { response, fromClaude } = await askNavigator(question, history);
  if (!response.event) {
    const building = matchBuilding(question) ?? matchBuilding(response.answer);
    response.location = building
      ? {
          name: building.name,
          mapUrl: getCampusMapUrl(building),
          lat: building.lat,
          lng: building.lng,
        }
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

  if (key && fromClaude) saveAnswer(key, response);

  return Response.json({ ...response, remaining });
}
