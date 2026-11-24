import type { Item } from "@/lib/learn/content-schema";
import type { LessonCard } from "@/lib/lessons/lesson-data";

type Content = Record<string, unknown>;

export function toLessonCard(type: string, content: Content): LessonCard {
  const c = content as Record<string, never>;

  switch (type) {
    case "flip":
      return { type: "concept", title: c.front, body: c.back };
    case "visual":
      return {
        type: "concept",
        title: c.title,
        body: c.caption ?? "",
        image: c.image,
      };
    case "choice": {
      const options = content.options as unknown[];
      if (
        Array.isArray(options) &&
        typeof options[0] === "object" &&
        options[0] !== null
      ) {
        const opts = options as {
          text: string;
          correct: boolean;
          feedback: string;
        }[];
        return {
          type: "choice",
          question: c.question,
          options: opts.map((o) => o.text),
          correctIndex: opts.findIndex((o) => o.correct),
          explanation: "",
          optionFeedback: opts.map((o) => o.feedback),
        };
      }
      return {
        type: "choice",
        question: c.question,
        options: c.options,
        correctIndex: c.correct_index,
        explanation: c.explanation,
      };
    }
    case "concept":
      return {
        type: "concept",
        title: c.title,
        body: c.body,
        image: c.image,
        alt: c.alt,
        icon: c.icon,
      };
    case "match_pairs":
      return {
        type: "match_pairs",
        prompt: c.prompt,
        pairs: c.pairs,
        explanation: c.explanation,
      };
    case "sort_buckets":
      return {
        type: "sort_buckets",
        prompt: c.prompt,
        buckets: c.buckets,
        cards: c.cards,
        explanation: c.explanation,
      };
    case "order_steps":
      return {
        type: "order_steps",
        prompt: c.prompt,
        steps: c.steps,
        explanation: c.explanation,
      };
    case "fill_gap":
      return {
        type: "fill_gap",
        sentence: c.sentence,
        answer: c.answer,
        choices: c.choices,
        explanation: c.explanation,
      };
    case "spot_scam":
      return {
        type: "spot_scam",
        channel: c.channel,
        sender: c.sender,
        body: c.body,
        answer: c.answer,
        teaching: c.teaching,
      };
    case "recap": {
      if (Array.isArray(content.terms))
        return { type: "recap", terms: c.terms };
     
      const points = Array.isArray(content.points)
        ? (content.points as string[])
        : [];
      return {
        type: "concept",
        title: "What you can do now",
        body: points.join(" "),
      };
    }
    default:
      return {
        type: "spot_scam",
        channel: "situation",
        body: c.scenario,
        answer: c.correct_answer,
        teaching: c.teaching,
      };
  }
}

export function itemToCardRow(item: Item): {
  type: Item["format"];
  content: Content;
} {
  const { id, objective, atoms, format, ...fields } = item;
  return {
    type: format,
    content: { ...fields, item_id: id, objective, atoms },
  };
}
