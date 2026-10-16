import { askNavigator } from "@/lib/navigator/ai";
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

  const response: NavigatorResponse = await askNavigator(body.question.trim());
  return Response.json(response);
}
