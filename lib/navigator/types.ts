export type NavigatorConfidence = "high" | "medium" | "low";

export type NavigatorEvent = {
  title: string;
  start: string | null;
  end: string | null;
  location_text: string;
};

export type NavigatorSource = {
  title: string;
  url: string;
};

export type NavigatorRelatedResource = {
  title: string;
  query: string;
  url?: string;
};

export type NavigatorContact = {
  name: string;
  email: string;
};

export type NavigatorResponse = {
  answer: string;
  steps: string[];
  related: NavigatorRelatedResource[];
  event: NavigatorEvent | null;
  sources: NavigatorSource[];
  confidence: NavigatorConfidence;
  contact: NavigatorContact | null;
};

export type EventStatus = "upcoming" | "in progress" | "ended";
