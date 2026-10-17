import { askNavigator } from "@/lib/navigator/ai";
import {
  findContact,
  findContactByEmail,
  getGeneralContact,
} from "@/lib/navigator/contacts";
import type { NavigatorResponse } from "@/lib/navigator/types";

export async function POST(request: Request): Promise<Response> {
  let body: { question?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please send a valid question." },
      { status: 400 },
    );
  }

  if (typeof body.question !== "string" || !body.question.trim()) {
    return Response.json(
      { error: "Enter a question for Campus Navigator." },
      { status: 400 },
    );
  }

  const question = body.question.trim();
  const response: NavigatorResponse = await askNavigator(question);
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
