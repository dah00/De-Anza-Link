import Anthropic from "@anthropic-ai/sdk";

import contacts from "@/data/contacts.json";
import { CAMPUS_NAVIGATOR_SYSTEM_PROMPT } from "@/lib/navigator/prompt";
import type { NavigatorResponse } from "@/lib/navigator/types";
import { validateNavigatorResponse } from "@/lib/navigator/validate";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";
const ANTHROPIC_TIMEOUT_MS = 40_000;

export const FOOD_KEYWORDS = [
  "food",
  "hungry",
  "pantry",
  "grocery",
  "groceries",
  "eat",
  "meal",
  "calfresh",
  "roary",
] as const;

export const BIKE_KEYWORDS = ["bike", "bicycle", "e-bike", "ebike"] as const;

export const COMPUTER_KEYWORDS = [
  "computer",
  "laptop",
  "chromebook",
  "ipad",
  "hotspot",
] as const;

export const COMMUTING_KEYWORDS = [
  "car",
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

export async function askNavigatorMock(
  question: string,
): Promise<NavigatorResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const normalizedQuestion = question
    .toLocaleLowerCase()
    .trim()
    .replace(/[\u2018\u2019]/g, "'");

  if (FOOD_KEYWORDS.some((keyword) => normalizedQuestion.includes(keyword))) {
    return {
      answer:
        "Current students can pick up groceries at Roary's Market, the campus food pantry in the Hub (Baldwin Winery Building). Bring your De Anza ID, be registered this term, and bring a bag. You can visit once a week. Village Centers also have snacks, soup, and drinks if you need something sooner.",
      steps: [
        "Go to the Hub in the Baldwin Winery Building. The entrance is on the north side, facing the A Quad.",
        "Bring your student ID and a bag. Fall hours are Monday 10 a.m.–4:30 p.m., and Tuesday–Thursday 10:30 a.m.–noon and 1–4 p.m. Closed Friday.",
        "For CalFresh grocery help, email dafoodpantry@deanza.edu or check the Roary's Market page.",
      ],
      related: [
        {
          title: "CalFresh",
          query: "How do I apply for CalFresh at De Anza?",
          url: "https://www.deanza.edu/resources/hub/roarys-market/",
        },
        {
          title: "Food around campus",
          query: "Where else can I get free snacks on campus?",
          url: "https://www.deanza.edu/resources/hub/roarys-market/locations.html",
        },
        {
          title: "Borrow a bike",
          query: "Can I borrow a bike at De Anza?",
        },
      ],
      event: null,
      sources: [
        source("Roary's Market", "/resources/hub/roarys-market/"),
        source(
          "Food sites around campus",
          "/resources/hub/roarys-market/locations.html",
        ),
      ],
      confidence: "high",
      contact: contactFor("free food"),
    };
  }

  if (BIKE_KEYWORDS.some((keyword) => normalizedQuestion.includes(keyword))) {
    return {
      answer:
        "DASG has a bike loaner program: qualified students can borrow a bike or e-bike for the quarter, plus a helmet, lock, and corral key, at no cost. You need to be 18 or older, hold a DASG card, be enrolled in at least 6 units, and have fees paid or be on an installment plan.",
      steps: [
        "Check that you meet the DASG Bike Program requirements.",
        "Submit the current-quarter request form on the DASG Bike Program page.",
        "If you need another way to campus, ask about parking and VTA options.",
      ],
      related: [
        {
          title: "Parking and transit",
          query: "How do I get to De Anza without a car?",
          url: "https://www.deanza.edu/parking/",
        },
        {
          title: "Free food",
          query: "Where can I get free food at De Anza?",
        },
      ],
      event: null,
      sources: [
        source("DASG Bike Program", "/collegelife/dasgbikeprogram.html"),
      ],
      confidence: "high",
      contact: contactFor("general questions"),
    };
  }

  if (
    COMPUTER_KEYWORDS.some((keyword) => normalizedQuestion.includes(keyword))
  ) {
    return {
      answer:
        "The Library loans laptops, Chromebooks, iPads, calculators, and Wi-Fi hotspots. Loan length depends on the device. You can also use desktops in the Library reference area and the Library Computer Lab (LC 113), which has Adobe and Microsoft 365. Printing is in the Computer Lab.",
      steps: [
        "Ask at the Library checkout desk about the device you need.",
        "For a longer-term computer of your own, look at the CompTechS program on the Need a Computer page.",
      ],
      related: [
        {
          title: "Need a computer?",
          query: "Where can I borrow a laptop at De Anza?",
          url: "https://www.deanza.edu/students/computers",
        },
        {
          title: "Free food",
          query: "Where can I get free food at De Anza?",
        },
      ],
      event: null,
      sources: [source("Need a Computer?", "/students/computers")],
      confidence: "high",
      contact: contactFor("general questions"),
    };
  }

  if (
    COMMUTING_KEYWORDS.some((keyword) => normalizedQuestion.includes(keyword))
  ) {
    return {
      answer:
        "De Anza posts current parking, SmartPass, and transit information on its parking pages. If you want a free ride around campus and nearby, DASG also loans bikes to students who qualify.",
      steps: [
        "Check the parking and transportation page for current options and hours.",
        "Ask about the DASG Bike Program if you want to borrow a bike for the quarter.",
      ],
      related: [
        {
          title: "Parking and transportation",
          query: "Tell me about De Anza parking and transportation options",
          url: "https://www.deanza.edu/parking/",
        },
        {
          title: "Borrow a bike",
          query: "Can I borrow a bike at De Anza?",
        },
      ],
      event: null,
      sources: [source("De Anza Parking and Transportation", "/parking/")],
      confidence: "medium",
      contact: contactFor("general questions"),
    };
  }

  if (PIQ_KEYWORDS.some((keyword) => normalizedQuestion.includes(keyword))) {
    return {
      answer:
        "The Transfer Center helps with UC applications and Personal Insight Questions. I don't have a confirmed workshop time in our notes, so check their page or email them for the next session.",
      steps: [
        "Open the Transfer Center page for current workshops and drop-in help.",
        "Email the Transfer Center if you need an appointment or the next PIQ workshop time.",
      ],
      related: [
        {
          title: "Transfer Center",
          query:
            "How can the De Anza Transfer Center help with my application?",
          url: "https://www.deanza.edu/transfercenter/",
        },
        {
          title: "Writing support",
          query:
            "What writing support is available for my PIQ essays at De Anza?",
        },
      ],
      event: null,
      sources: [source("Transfer Center", "/transfercenter/")],
      confidence: "medium",
      contact: contactFor("PIQ"),
    };
  }

  return {
    answer:
      "I don't have that in our campus notes. Tell me the office or service — food, bikes, computers, financial aid, or transfer — and I'll look again. You can also start at deanza.edu.",
    steps: [
      "Name the program or service you need, or pick one of the related questions.",
    ],
    related: [
      {
        title: "Free food",
        query: "Where can I get free food at De Anza?",
      },
      {
        title: "Borrow a bike",
        query: "Can I borrow a bike at De Anza?",
      },
      {
        title: "Borrow a computer",
        query: "Where can I borrow a laptop at De Anza?",
      },
      {
        title: "Financial aid",
        query: "How do I get help with financial aid at De Anza?",
      },
    ],
    event: null,
    sources: [source("De Anza College", "/")],
    confidence: "low",
    contact: contactFor("general questions"),
  };
}
type ConversationMessage = { role: "user" | "assistant"; content: string };

function buildMessages(question: string, history: ConversationMessage[]) {
  const recent = history.slice(-8);
  // The API needs the conversation to start with a user message.
  while (recent.length > 0 && recent[0].role !== "user") recent.shift();
  return [...recent, { role: "user" as const, content: question }];
}

export async function askNavigator(
  question: string,
  history: ConversationMessage[] = [],
): Promise<NavigatorResponse> {
  if (process.env.USE_MOCK_AI === "true") {
    return askNavigatorMock(question);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(
      "Campus Navigator Claude request skipped: API key is not configured.",
    );
    return askNavigatorMock(question);
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create(
      {
        model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
        max_tokens: 4_000,
        system: CAMPUS_NAVIGATOR_SYSTEM_PROMPT,
        messages: buildMessages(question, history),
        tools: [
          {
            type: "web_search_20260318",
            name: "web_search",
            allowed_callers: ["direct"],
            allowed_domains: ["deanza.edu"],
            max_uses: 3,
          },
        ],
      },
      { timeout: ANTHROPIC_TIMEOUT_MS },
    );
    const response = validateNavigatorResponse(message.content);

    if (!response) {
      if (process.env.NODE_ENV !== "production") {
        const rawText = message.content
          .map((block) => (block.type === "text" ? block.text : ""))
          .join("");
        console.error("Campus Navigator stop_reason:", message.stop_reason);
        console.error(
          "Campus Navigator raw reply (first 800 chars):",
          rawText.slice(0, 800),
        );
      }
      throw new Error("Claude returned an invalid Navigator response.");
    }

    return response;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    console.error("Campus Navigator Claude request failed:", reason);
    return askNavigatorMock(question);
  }
}
