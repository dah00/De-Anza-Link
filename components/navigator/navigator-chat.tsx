"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink, LoaderCircle, MapPin, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCampusMapUrl, matchBuilding } from "@/lib/navigator/buildings";
import { findContactByEmail } from "@/lib/navigator/contacts";
import { getEventStatus } from "@/lib/navigator/event-status";
import type {
  NavigatorRelatedResource,
  NavigatorResponse,
} from "@/lib/navigator/types";

const statusVariant = {
  upcoming:
    "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  in_progress:
    "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  ended:
    "border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  unknown:
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
} as const;

type NavigatorTurn = {
  question: string;
  response: NavigatorResponse;
};

type NavigatorHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

function formatEventTime(value: string | null): string {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return "Time not confirmed";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  }).format(new Date(value));
}

function isRelatedResource(
  resource: unknown,
): resource is NavigatorRelatedResource {
  return (
    typeof resource === "object" &&
    resource !== null &&
    "title" in resource &&
    typeof resource.title === "string" &&
    "query" in resource &&
    typeof resource.query === "string" &&
    (!("url" in resource) ||
      resource.url === undefined ||
      typeof resource.url === "string")
  );
}

function NavigatorAnswerCard({
  response,
  isLoading,
  onRelatedResourceClick,
}: {
  response: NavigatorResponse;
  isLoading: boolean;
  onRelatedResourceClick: (question: string) => void;
}) {
  const eventStatus = response.event
    ? getEventStatus(response.event)
    : "unknown";
  const eventBuilding = response.event
    ? matchBuilding(response.event.location_text)
    : null;
  const mapUrl = eventBuilding ? getCampusMapUrl(eventBuilding) : null;
  const contact = response.contact
    ? findContactByEmail(response.contact.email)
    : null;
  const relatedResources = Array.isArray(response.related)
    ? response.related.filter(isRelatedResource)
    : [];

  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      contact &&
      !contact.verified
    ) {
      console.warn(
        "Campus Navigator is showing an unverified contact:",
        contact.name,
      );
    }
  }, [contact]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Campus Navigator</CardTitle>
          <Badge
            variant={response.confidence === "low" ? "outline" : "secondary"}
          >
            {response.confidence} confidence
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{response.answer}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h2 className="mb-2 text-sm font-semibold">Next steps</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {response.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        {relatedResources.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">
              {response.confidence === "low"
                ? "Did you mean one of these?"
                : "Related resources"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedResources.map((resource) => (
                <Button
                  key={resource.title}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRelatedResourceClick(resource.query)}
                  disabled={isLoading}
                >
                  {resource.title}
                </Button>
              ))}
            </div>
          </section>
        )}

        {response.event && (
          <section className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{response.event.title}</h2>
              <Badge variant="outline" className={statusVariant[eventStatus]}>
                {eventStatus.replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatEventTime(response.event.start)} –{" "}
              {formatEventTime(response.event.end)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {response.event.location_text}
            </p>
            {mapUrl && (
              <Button
                render={
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" />
                }
                nativeButton={false}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <MapPin /> Open campus map
              </Button>
            )}
            {!mapUrl && (
              <div className="mt-3 text-sm text-muted-foreground">
                <p>Location not confirmed.</p>
                {contact && (
                  <p>
                    Contact {contact.name}:{" "}
                    <a
                      className="underline underline-offset-4"
                      href={`mailto:${contact.email}`}
                    >
                      {contact.email}
                    </a>
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {response.location && (
          <section className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {response.location.name}
            </span>
            <Button
              render={
                <a
                  href={response.location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              nativeButton={false}
              variant="outline"
              size="sm"
            >
              <MapPin /> Open campus map
            </Button>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold">Sources</h2>
          <ul className="space-y-1 text-sm">
            {response.sources.map((source) => (
              <li key={source.url}>
                <a
                  className="inline-flex items-center gap-1 underline underline-offset-4"
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.title} <ExternalLink className="size-3" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {contact && (
          <section>
            <h2 className="mb-1 text-sm font-semibold">
              {contact.isGeneral ? "General help" : "Who to ask"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {contact.department === contact.name
                ? contact.name
                : `${contact.department}: ${contact.name}`}
            </p>
            <p className="text-sm text-muted-foreground">
              <a
                className="underline underline-offset-4"
                href={`mailto:${contact.email}`}
              >
                {contact.email}
              </a>
            </p>
            <a
              className="mt-1 inline-flex text-sm underline underline-offset-4"
              href={contact.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit {contact.department}
            </a>
          </section>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Campus Navigator uses De Anza sources and will ask when it needs more
        detail.
      </CardFooter>
    </Card>
  );
}

export function NavigatorChat() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<NavigatorTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submitQuestion(nextQuestion: unknown) {
    if (typeof nextQuestion !== "string") return;

    const trimmedQuestion = nextQuestion.trim();
    if (!trimmedQuestion) return;

    setIsLoading(true);
    setError(null);

    try {
      const history: NavigatorHistoryMessage[] = turns
        .slice(-4)
        .flatMap((turn) => [
          { role: "user", content: turn.question },
          {
            role: "assistant",
            content:
              `${turn.response.answer}\n${turn.response.steps.join("\n")}`.slice(
                0,
                1200,
              ),
          },
        ]);
      const result = await fetch("/api/navigator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion, history }),
      });
      const data: NavigatorResponse | { error: string } = await result.json();

      if (!result.ok || "error" in data) {
        throw new Error(
          "error" in data
            ? data.error
            : "Campus Navigator could not answer right now.",
        );
      }

      setTurns((currentTurns) => [
        ...currentTurns,
        { question: trimmedQuestion, response: data },
      ]);
      setQuestion("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Campus Navigator could not answer right now. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitQuestion(question);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {turns.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => {
              setTurns([]);
              setQuestion("");
              setError(null);
            }}
          >
            New conversation
          </Button>
        </div>
      )}

      {turns.map((turn, index) => (
        <div key={index} className="space-y-3">
          <p className="ml-auto max-w-2xl rounded-lg bg-muted px-4 py-3 text-sm">
            {turn.question}
          </p>
          <NavigatorAnswerCard
            response={turn.response}
            isLoading={isLoading}
            onRelatedResourceClick={submitQuestion}
          />
        </div>
      ))}

      {isLoading && (
        <Card aria-live="polite">
          <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Finding the best De
            Anza resource…
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50" role="alert">
          <CardContent className="py-6 text-sm">{error}</CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={
            turns.length > 0
              ? "Ask a follow-up question"
              : "I don't have a car, how do I get to campus?"
          }
          aria-label="Ask Campus Navigator"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !question.trim()}>
          {isLoading ? <LoaderCircle className="animate-spin" /> : <Send />}
          Ask
        </Button>
      </form>
    </div>
  );
}
