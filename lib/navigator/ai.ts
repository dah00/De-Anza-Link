import contacts from "@/data/contacts.json";
import type { NavigatorResponse } from "@/lib/navigator/types";

export const navigatorSystemPrompt = `You are Campus Navigator for De Anza students. Return ONLY valid JSON matching the NavigatorResponse shape. Use only information from deanza.edu. Never invent buildings, times, or email addresses. If unsure, set confidence to "low" and provide the best contact. If the answer depends on the student's situation, ask one short follow-up question instead of guessing.`;

// Use a positive value for upcoming, -30 for in progress, or -90 for ended.
const PIQ_MOCK_OFFSET_MINUTES = 15;

export const COMMUTING_KEYWORDS = [
  "car",
  "bike",
  "bicycle",
  "commute",
  "commuting",
  "transit",
  "bus",
  "vta",
  "parking",
  "ride",
  "get to campus",
  "getting to campus",
  "transportation",
] as const;

export const PIQ_KEYWORDS = [
  "piq",
  "personal insight",
  "workshop",
  "essay",
] as const;

const source = (title: string, path: string) => ({
  title,
  url: `https://www.deanza.edu${path}`,
});

function contactFor(topic: string) {
  const contact =
    contacts.find((item) => item.topics.includes(topic)) ?? contacts[1];
  return { name: contact.name, email: contact.email };
}

export async function askNavigator(
  question: string,
): Promise<NavigatorResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const normalizedQuestion = question
    .toLocaleLowerCase()
    .trim()
    .replace(/[\u2018\u2019]/g, "'");

  if (
    COMMUTING_KEYWORDS.some((keyword) => normalizedQuestion.includes(keyword))
  ) {
    return {
      answer:
        "Start by checking De Anza's transportation information, then plan a route that fits your class time.",
      steps: [
        "Check De Anza transportation and parking information for current campus options.",
        "Plan your route before your first class and allow extra time for transfers.",
        "Contact Outreach if you need help finding the right student resource.",
      ],
      related: [
        {
          title: "Parking and transportation",
          query: "Tell me about De Anza parking and transportation options",
          url: "https://www.deanza.edu/parking/",
        },
        {
          title: "Student support services",
          query: "What student support services are available at De Anza?",
        },
        {
          title: "Accessibility services",
          query: "How can I contact De Anza accessibility services?",
        },
      ],
      event: null,
      sources: [source("De Anza Parking and Transportation", "/parking/")],
      confidence: "medium",
      contact: contactFor("general questions"),
    };
  }

  if (PIQ_KEYWORDS.some((keyword) => normalizedQuestion.includes(keyword))) {
    const start = new Date(Date.now() + PIQ_MOCK_OFFSET_MINUTES * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    return {
      answer:
        "The Transfer Center offers UC Personal Insight Questions workshops. This mock event is included so you can test the event card.",
      steps: [
        "Review the workshop details on the De Anza event page.",
        "Register through the Transfer Center when registration is available.",
        "Bring a draft or a few ideas for your Personal Insight Questions.",
      ],
      related: [
        {
          title: "Transfer Center",
          query:
            "How can the De Anza Transfer Center help with my application?",
        },
        {
          title: "UC application support",
          query: "What UC application support is available at De Anza?",
        },
        {
          title: "Writing support",
          query:
            "What writing support is available for my PIQ essays at De Anza?",
        },
      ],
      event: {
        title: "Mock: UC Personal Insight Questions Workshop",
        start: start.toISOString(),
        end: end.toISOString(),
        location_text: "Learning Center (LC)",
      },
      sources: [source("UC Personal Insight Questions Workshop", "/events/")],
      confidence: "high",
      contact: contactFor("PIQ"),
    };
  }

  return {
    answer:
      "I need one more detail to point you to the right De Anza resource: what program or service is this about?",
    steps: ["Tell us the program, deadline, or service you need help with."],
    related: [
      {
        title: "Financial aid",
        query: "How do I get help with financial aid at De Anza?",
      },
      {
        title: "Transfer to a 4-year university",
        query: "How do I transfer to a 4-year university from De Anza?",
      },
      {
        title: "Parking and transportation",
        query: "How do I get to De Anza without a car?",
      },
      {
        title: "Library and tutoring",
        query: "Where can I get tutoring or use the library at De Anza?",
      },
    ],
    event: null,
    sources: [source("De Anza College", "/")],
    confidence: "low",
    contact: contactFor("general questions"),
  };
}
