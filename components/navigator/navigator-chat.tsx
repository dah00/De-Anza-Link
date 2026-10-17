"use client";

import { useState, type FormEvent } from "react";
import { ExternalLink, LoaderCircle, Send } from "lucide-react";

import { CampusMapPreview } from "@/components/navigator/campus-map-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCampusMapUrl, matchBuilding } from "@/lib/navigator/buildings";
import { findContactByEmail } from "@/lib/navigator/contacts";
import { getEventStatus } from "@/lib/navigator/event-status";
import type {
  NavigatorRelatedResource,
  NavigatorResponse,
} from "@/lib/navigator/types";
import { cn } from "@/lib/utils";

const STARTERS = [
  "Where can I get free food?",
  "Can I borrow a bike?",
  "Where can I borrow a laptop?",
];

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

function Chip({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-left text-sm whitespace-nowrap transition-colors",
        "hover:border-primary/40 disabled:opacity-50",
      )}
    >
      {children}
    </button>
  );
}

function AnswerCard({
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
  const showContact = contact?.verified === true;
  const relatedResources = Array.isArray(response.related)
    ? response.related.filter(isRelatedResource)
    : [];

  return (
    <article className="rounded-xl border bg-card p-4">
      <p className="text-[15px] leading-relaxed">{response.answer}</p>

      {response.steps.length > 0 && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold">What to do</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {response.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {relatedResources.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold">
            {response.confidence === "low" ? "Try one of these" : "Related"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedResources.map((resource) => (
              <Chip
                key={resource.title}
                disabled={isLoading}
                onClick={() => onRelatedResourceClick(resource.query)}
              >
                {resource.title}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {response.event && (
        <section className="mt-4 rounded-xl border p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">{response.event.title}</h2>
            <p className="text-xs font-medium text-muted-foreground">
              {eventStatus.replace("_", " ")}
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatEventTime(response.event.start)}
            {response.event.end
              ? ` – ${formatEventTime(response.event.end)}`
              : ""}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {response.event.location_text}
          </p>
          {eventBuilding && mapUrl && (
            <div className="mt-3">
              <CampusMapPreview
                name={eventBuilding.name}
                lat={eventBuilding.lat}
                lng={eventBuilding.lng}
                mapUrl={mapUrl}
              />
            </div>
          )}
        </section>
      )}

      {response.location && (
        <div className="mt-4">
          <CampusMapPreview
            name={response.location.name}
            lat={response.location.lat}
            lng={response.location.lng}
            mapUrl={response.location.mapUrl}
          />
        </div>
      )}

      {response.sources.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-sm font-semibold">Sources</h2>
          <ul className="space-y-1 text-sm">
            {response.sources.map((source) => (
              <li key={source.url}>
                <a
                  className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
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
      )}

      {showContact && (
        <section className="mt-4">
          <h2 className="mb-1 text-sm font-semibold">
            {contact.isGeneral ? "General help" : "Who to ask"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {contact.department === contact.name
              ? contact.name
              : `${contact.department}: ${contact.name}`}
          </p>
          <p className="text-sm">
            <a
              className="font-medium text-primary underline-offset-4 hover:underline"
              href={`mailto:${contact.email}`}
            >
              {contact.email}
            </a>
          </p>
          {contact.pageUrl && (
            <a
              className="mt-1 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
              href={contact.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open their page
            </a>
          )}
        </section>
      )}
    </article>
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
            : "Couldn't look that up right now. Try again in a second.",
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
          : "Couldn't look that up right now. Try again in a second.",
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
    <div className="flex flex-col gap-4">
      {turns.length === 0 && !isLoading && (
        <div>
          <p className="text-sm text-muted-foreground">Try asking</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <Chip
                key={starter}
                disabled={isLoading}
                onClick={() => submitQuestion(starter)}
              >
                {starter}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {turns.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setTurns([]);
              setQuestion("");
              setError(null);
            }}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            Start over
          </button>
        </div>
      )}

      {turns.map((turn, index) => (
        <div key={index} className="flex flex-col gap-3">
          <p className="ml-auto max-w-[85%] rounded-xl bg-muted px-4 py-3 text-sm">
            {turn.question}
          </p>
          <AnswerCard
            response={turn.response}
            isLoading={isLoading}
            onRelatedResourceClick={submitQuestion}
          />
        </div>
      ))}

      {isLoading && (
        <p
          className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <LoaderCircle className="size-4 animate-spin" />
          Looking that up…
        </p>
      )}

      {error && (
        <p
          className="rounded-xl border border-dashed p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={
            turns.length > 0 ? "Ask a follow-up" : "Where can I get free food?"
          }
          aria-label="Ask about De Anza resources"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="lg"
          className="h-10"
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? <LoaderCircle className="animate-spin" /> : <Send />}
          Ask
        </Button>
      </form>
    </div>
  );
}
