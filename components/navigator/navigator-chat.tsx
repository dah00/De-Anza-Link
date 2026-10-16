"use client";

import { useState, type FormEvent } from "react";
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
import { getEventStatus } from "@/lib/navigator/event-status";
import { getBuildingMapUrl } from "@/lib/navigator/location";
import type {
  NavigatorRelatedResource,
  NavigatorResponse,
} from "@/lib/navigator/types";

const statusVariant = {
  upcoming: "secondary",
  "in progress": "default",
  ended: "outline",
} as const;

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

export function NavigatorChat() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<NavigatorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submitQuestion(nextQuestion: unknown) {
    if (typeof nextQuestion !== "string") return;

    const trimmedQuestion = nextQuestion.trim();
    if (!trimmedQuestion) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetch("/api/navigator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion }),
      });
      const data: NavigatorResponse | { error: string } = await result.json();

      if (!result.ok || "error" in data) {
        throw new Error(
          "error" in data
            ? data.error
            : "Campus Navigator could not answer right now.",
        );
      }

      setResponse(data);
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

  function handleRelatedResourceClick(resource: NavigatorRelatedResource) {
    console.log("Navigator related resource clicked:", resource);

    if (resource.url) {
      window.open(resource.url, "_blank", "noopener,noreferrer");
      return;
    }

    void submitQuestion(resource.query);
  }

  const eventStatus = response?.event ? getEventStatus(response.event) : null;
  const mapUrl = response?.event
    ? getBuildingMapUrl(response.event.location_text)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="I don't have a car, how do I get to campus?"
          aria-label="Ask Campus Navigator"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !question.trim()}>
          {isLoading ? <LoaderCircle className="animate-spin" /> : <Send />}
          Ask
        </Button>
      </form>

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

      {response && !isLoading && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Campus Navigator</CardTitle>
              <Badge
                variant={
                  response.confidence === "low" ? "outline" : "secondary"
                }
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

            <section>
              <h2 className="mb-2 text-sm font-semibold">Related resources</h2>
              <div className="flex flex-wrap gap-2">
                {response.related.filter(isRelatedResource).map((resource) => (
                  <Button
                    key={resource.title}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => handleRelatedResourceClick(resource)}
                  >
                    {resource.title}
                  </Button>
                ))}
              </div>
            </section>

            {response.event && (
              <section className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">{response.event.title}</h2>
                  {eventStatus && (
                    <Badge variant={statusVariant[eventStatus]}>
                      {eventStatus}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {response.event.location_text}
                  {response.event.start &&
                    ` · ${new Date(response.event.start).toLocaleString()}`}
                </p>
                {mapUrl && (
                  <Button
                    render={
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    nativeButton={false}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    <MapPin /> Open map
                  </Button>
                )}
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

            {response.contact && (
              <section>
                <h2 className="mb-1 text-sm font-semibold">Contact</h2>
                <p className="text-sm text-muted-foreground">
                  {response.contact.name}:{" "}
                  <a
                    className="underline underline-offset-4"
                    href={`mailto:${response.contact.email}`}
                  >
                    {response.contact.email}
                  </a>
                </p>
              </section>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Campus Navigator uses De Anza sources and will ask when it needs
            more detail.
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
