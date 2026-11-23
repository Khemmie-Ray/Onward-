import { z } from "zod";
import { VALID_CARD_ICONS } from "@/lib/learn/card-icons";

const slug = z
  .string()
  .regex(/^[A-Za-z0-9-]+$/, "Slugs use letters, numbers and dashes only");

export const ObjectiveId = z
  .string()
  .regex(
    /^[a-z0-9-]+\.[a-z0-9-]+$/,
    'Objective ids look like "section-slug.key"',
  );

const atomId = z
  .string()
  .regex(/^[a-z0-9-]+\.(concept|fact|scenario|misconception)\.[a-z0-9-]+$/);

const itemId = z.string().regex(/^[a-z0-9-]+\.\d{2}$/);

const allDifferent = (values: string[]) =>
  new Set(values).size === values.length;

const iconKey = z
  .string()
  .refine(
    (k) => (VALID_CARD_ICONS as readonly string[]).includes(k),
    "Unknown icon key",
  );

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(
      (s) => !s.includes("\u2014"),
      "No em dashes in learner-facing text",
    );

export const Level = z.enum(["aware", "safe", "active", "builder"]);

export const Objective = z.object({
  id: ObjectiveId,
  can: text(140).refine(
    (s) => s.startsWith("Can "),
    'Start objectives with "Can "',
  ),
  level: Level,
  builds_on: z.array(ObjectiveId).default([]),
});

export const Section = z.object({
  slug,
  title: text(80),
  objectives: z.array(Objective).min(1),
});

export const Module = z.object({
  slug,
  title: text(80),
  description: text(300).optional(),
  icon: z.string().optional(),
  status: z.enum(["available", "coming_soon"]),
  sections: z.array(Section),
});

export const Course = z.object({
  slug,
  title: text(80),
  modules: z.array(Module).min(1),
});

const atomBase = { id: atomId, objective: ObjectiveId };

export const ConceptAtom = z.object({
  ...atomBase,
  kind: z.literal("concept"),
  short: text(160),
  long: text(600),
});

export const FactAtom = z.object({
  ...atomBase,
  kind: z.literal("fact"),
  claim: text(200),
  source_url: z.url(),
  volatile: z.boolean(),
  checked_on: z.iso.date(),
});

export const ScenarioAtom = z.object({
  ...atomBase,
  kind: z.literal("scenario"),
  channel: z.enum([
    "situation",
    "dm",
    "whatsapp",
    "sms",
    "tweet",
    "email",
    "wallet_popup",
    "web_page",
    "in_person",
  ]),
  setup: text(280),
  is_scam: z.boolean().optional(),
  lesson: text(200),
});

export const MisconceptionAtom = z.object({
  ...atomBase,
  kind: z.literal("misconception"),
  belief: text(140),
  correction: text(240),
});

export const Atom = z.discriminatedUnion("kind", [
  ConceptAtom,
  FactAtom,
  ScenarioAtom,
  MisconceptionAtom,
]);

// ─── Items (exercise formats) ───────────────────────────────────────────────

const itemBase = {
  id: itemId,
  objective: ObjectiveId,
  atoms: z.array(atomId).default([]),
};

export const ConceptItem = z
  .object({
    ...itemBase,
    format: z.literal("concept"),
    title: text(60),
    body: text(280),
    image: z.string().optional(),
    alt: text(160).optional(),
    icon: z.union([iconKey, z.array(iconKey).min(2).max(4)]).optional(),
  })
  .refine((i) => !i.image || Boolean(i.alt), {
    message: "An image needs alt text",
  });

export const ChoiceItem = z
  .object({
    ...itemBase,
    format: z.literal("choice"),
    question: text(160),
    options: z
      .array(
        z.object({ text: text(90), correct: z.boolean(), feedback: text(200) }),
      )
      .min(2)
      .max(4),
  })
  .refine((i) => i.options.filter((o) => o.correct).length === 1, {
    message: "Exactly one option must be correct",
  });

export const MatchPairsItem = z
  .object({
    ...itemBase,
    format: z.literal("match_pairs"),
    prompt: text(120),
    pairs: z
      .array(z.object({ left: text(40), right: text(60) }))
      .min(3)
      .max(5),
    explanation: text(240),
  })
  .refine(
    (i) =>
      allDifferent(i.pairs.map((p) => p.left)) &&
      allDifferent(i.pairs.map((p) => p.right)),
    { message: "Every left and every right side must be different" },
  );

export const SortBucketsItem = z
  .object({
    ...itemBase,
    format: z.literal("sort_buckets"),
    prompt: text(120),
    buckets: z
      .array(z.object({ id: slug, label: text(30) }))
      .min(2)
      .max(3),
    cards: z
      .array(z.object({ text: text(50), bucket: slug }))
      .min(4)
      .max(8),
    explanation: text(240),
  })
  .refine(
    (i) => i.cards.every((c) => i.buckets.some((b) => b.id === c.bucket)),
    {
      message: "Every card must point at one of the buckets",
    },
  )
  .refine(
    (i) => i.buckets.every((b) => i.cards.some((c) => c.bucket === b.id)),
    {
      message: "Every bucket needs at least one card",
    },
  )
  .refine((i) => allDifferent(i.cards.map((c) => c.text)), {
    message: "Every card must be different",
  });

export const OrderStepsItem = z.object({
  ...itemBase,
  format: z.literal("order_steps"),
  prompt: text(120),
  steps: z
    .array(text(70))
    .min(3)
    .max(6)
    .refine(allDifferent, "Every step must be different"),
  explanation: text(240),
});

export const FillGapItem = z
  .object({
    ...itemBase,
    format: z.literal("fill_gap"),
    sentence: text(160),
    answer: text(30),
    choices: z
      .array(text(30))
      .min(2)
      .max(4)
      .refine(allDifferent, "Every choice must be different"),
    explanation: text(200),
  })
  .refine((i) => i.sentence.split("___").length === 2, {
    message: 'The sentence needs exactly one "___" gap',
  })
  .refine((i) => i.choices.includes(i.answer), {
    message: "The answer must be one of the choices",
  });

export const SpotScamItem = z.object({
  ...itemBase,
  format: z.literal("spot_scam"),
  channel: ScenarioAtom.shape.channel,
  sender: text(40).optional(),
  body: text(280),
  answer: z.enum(["scam", "real"]),
  teaching: text(240),
});

export const RecapTerm = z.object({
  meaning: text(120),
  word: text(30),
  accept: z.array(text(30)).default([]),
});

export const RecapItem = z.object({
  ...itemBase,
  format: z.literal("recap"),
  terms: z.array(RecapTerm).length(2),
});

export const Item = z.discriminatedUnion("format", [
  ConceptItem,
  ChoiceItem,
  MatchPairsItem,
  SortBucketsItem,
  OrderStepsItem,
  FillGapItem,
  SpotScamItem,
  RecapItem,
]);

export const INTERACTIVE_FORMATS = new Set<Item["format"]>([
  "choice",
  "match_pairs",
  "sort_buckets",
  "order_steps",
  "fill_gap",
  "spot_scam",
]);

export const SectionContent = z.object({
  section: slug,
  atoms: z.array(Atom),
  items: z.array(Item).min(4).max(14),
});

export type Level = z.infer<typeof Level>;
export type Objective = z.infer<typeof Objective>;
export type Section = z.infer<typeof Section>;
export type Module = z.infer<typeof Module>;
export type Course = z.infer<typeof Course>;
export type Atom = z.infer<typeof Atom>;
export type Item = z.infer<typeof Item>;
export type SectionContent = z.infer<typeof SectionContent>;
export type CourseInput = z.input<typeof Course>;
export type SectionContentInput = z.input<typeof SectionContent>;
