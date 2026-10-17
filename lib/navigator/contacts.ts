import contacts from "@/data/contacts.json";

export type Contact = (typeof contacts)[number];

function normalize(value: string): string {
  return value.toLocaleLowerCase().trim();
}

export function findContact(
  question: string,
  topicsHint: string[] = [],
): Contact | null {
  const normalizedQuestion = normalize(question);
  const normalizedHints = topicsHint.map(normalize);

  const bestMatch = contacts
    .map((contact) => ({
      contact,
      score: contact.topics.reduce((score, topic) => {
        const normalizedTopic = normalize(topic);
        const questionMatch = normalizedQuestion.includes(normalizedTopic);
        const hintMatch = normalizedHints.some((hint) =>
          hint.includes(normalizedTopic),
        );

        return score + Number(questionMatch) + Number(hintMatch);
      }, 0),
    }))
    .reduce((best, match) => (match.score > best.score ? match : best), {
      contact: null as Contact | null,
      score: 0,
    });

  return bestMatch.score > 0 ? bestMatch.contact : null;
}

export function findContactByEmail(email: string): Contact | null {
  const normalizedEmail = normalize(email);
  return (
    contacts.find((contact) => normalize(contact.email) === normalizedEmail) ??
    null
  );
}

export function getGeneralContact(): Contact | null {
  return contacts.find((contact) => contact.isGeneral) ?? null;
}
