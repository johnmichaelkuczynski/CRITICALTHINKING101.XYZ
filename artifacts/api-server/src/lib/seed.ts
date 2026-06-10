import { db } from "@workspace/db";
import {
  topicsTable,
  lecturesTable,
  assignmentsTable,
  problemsTable,
} from "@workspace/db";
import { sql, eq, and } from "drizzle-orm";
import { logger } from "./logger";

type SeedTopic = {
  slug: string;
  title: string;
  weekNumber: number;
  blurb: string;
  lectureTitle: string;
  body: string;
};

const TOPICS: SeedTopic[] = [
  // Week 1 — Foundations of critical thinking
  {
    slug: "what-is-critical-thinking",
    title: "What critical thinking is and why it matters",
    weekNumber: 1,
    blurb: "Evaluating reasoning fairly; what it is, what it is not.",
    lectureTitle: "1.1 What critical thinking is and why it matters",
    body: `# What critical thinking is and why it matters

Critical thinking is the disciplined practice of *evaluating reasoning* — your own and others' — to decide what is reasonable to believe or do. It is not about being negative or clever; it is about being **fair, careful, and honest** with evidence and argument.

## What it is not

- It is **not** simply disagreeing or finding fault.
- It is **not** raw intelligence or knowing many facts.
- It is **not** winning arguments by any means available.

## The core moves

A critical thinker habitually asks four questions:

1. **What exactly is being claimed?**
2. **What reasons are offered?**
3. **Are those reasons true, and do they actually support the claim?**
4. **What's being assumed, and what's been left out?**

## Why it matters

We are flooded with claims — ads, headlines, posts, statistics, expert testimony. Critical thinking is the skill that separates what is worth believing from what merely sounds convincing. It protects you from manipulation by others and from your own biases.

Consider **Theranos**. For years, sophisticated investors, journalists, and board members accepted Elizabeth Holmes's claim that a single drop of blood could run hundreds of medical tests — because the story was thrilling and the founder charismatic. The company unraveled only after *Wall Street Journal* reporter John Carreyrou did what critical thinking demands: he stopped asking whether the pitch was *persuasive* and started asking whether the actual evidence showed the machines worked. They never had.

## Metacognition

Critical thinking is partly **metacognition** — thinking about your own thinking. The strongest reasoners notice when they are confused, when they *want* something to be true, and when they have reasoned past the evidence.`,
  },
  {
    slug: "claims-beliefs-truth",
    title: "Claims, beliefs, and truth",
    weekNumber: 1,
    blurb: "The statement as the atom of reasoning; belief vs. truth.",
    lectureTitle: "1.2 Claims, beliefs, and truth",
    body: `# Claims, beliefs, and truth

The atom of reasoning is the **claim** (also called a *statement* or *proposition*): a sentence that is either true or false.

## Claims vs. non-claims

- "The Earth orbits the Sun." — a claim (and true).
- "Close the door." — a command, **not** a claim.
- "What time is it?" — a question, **not** a claim.
- "Ouch!" — an exclamation, **not** a claim.

Only claims can serve as premises or conclusions, because only claims can be true or false.

## Belief vs. truth

A **belief** is a claim you accept. **Truth** is whether the claim matches reality. These two come apart: you can believe something false, and something can be true that you do not believe. Critical thinking is the work of bringing your beliefs closer to the truth.

History is full of widely-held false beliefs. In 1998 a paper in *The Lancet* by Andrew Wakefield claimed the MMR vaccine caused autism, and millions came to believe it. But the belief did not match reality: the study was found to be fraudulent, *The Lancet* fully retracted it in 2010, and Wakefield lost his medical license. Sincere, widespread belief never makes a claim true.

## Facts vs. opinions

The fact/opinion split is rougher than people think. "Chocolate is tasty" reports a preference. But "Vaccines cause autism" is sometimes *called* an opinion when it is really a **false factual claim**. Ask: is this about a *preference*, or about *how the world is*?`,
  },
  {
    slug: "arguments-vs-nonarguments",
    title: "Arguments vs. non-arguments",
    weekNumber: 1,
    blurb: "An argument supports a claim; descriptions and explanations do not.",
    lectureTitle: "1.3 Arguments vs. non-arguments",
    body: `# Arguments vs. non-arguments

In critical thinking, an **argument** is not a quarrel. It is a set of claims in which some (the *premises*) are offered as reasons to accept another (the *conclusion*).

## The test for an argument

Ask: **is something being supported by something else?** If yes, it is an argument. If the passage merely reports, describes, explains, or illustrates without trying to *prove* a point, it is a non-argument.

## Common non-arguments

- **Description:** "The room was cold and dark."
- **Explanation:** "The I-35W bridge in Minneapolis collapsed in 2007 because its steel gusset plates were undersized." (tells *why* it collapsed, not *that* it collapsed)
- **Report:** "Officials announced the new policy yesterday."
- **Illustration:** "Many metals conduct electricity; copper, for example."

## Argument vs. explanation

This is the hardest distinction. An **argument** tries to convince you *that* something is true. An **explanation** assumes you already accept it and tells you *why* it happened. Same grammar, different job — look at whether the conclusion is genuinely in doubt.

No one disputed *that* the I-35W bridge had fallen — the wreckage was on every newscast. So when federal investigators pointed to the undersized gusset plates, they were not arguing that it collapsed; they were *explaining* a fact everyone already accepted. The conclusion was never in doubt, which is the tell-tale sign of an explanation rather than an argument.`,
  },
  {
    slug: "premises-and-conclusions",
    title: "Premises and conclusions",
    weekNumber: 1,
    blurb: "The two parts of every argument and the words that flag them.",
    lectureTitle: "1.4 Premises and conclusions",
    body: `# Premises and conclusions

Every argument has two parts: **premises** (the reasons) and a **conclusion** (the claim the reasons support).

## Indicator words

Certain words flag each part:

- **Conclusion indicators:** *therefore, so, thus, hence, consequently, it follows that.*
- **Premise indicators:** *because, since, for, given that, as, on the grounds that.*

"**Since** the streets are wet, it must have rained." — "since" flags the premise (streets are wet); the conclusion is "it rained."

## Watch the order

Conclusions can come first, last, or in the middle: "We should leave now, because the storm is coming." Here the conclusion ("we should leave now") is stated first.

## No indicators?

Many arguments use no indicator words at all. Then you ask the key question: **which claim is the author trying to get me to accept, and which claims are doing the supporting?**

Real arguments often hide their structure. When the U.S. Surgeon General's 1964 report concluded that smoking causes lung cancer, that conclusion rested on premises scattered across hundreds of pages — rising lung-cancer rates, animal experiments, and dose-response data. No single "therefore" announced it; the reader had to see which one claim all the evidence was marshalled to support.`,
  },
  {
    slug: "identifying-reconstructing-arguments",
    title: "Identifying and reconstructing arguments",
    weekNumber: 1,
    blurb: "Pulling a clean argument out of messy prose; implicit premises.",
    lectureTitle: "1.5 Identifying and reconstructing arguments",
    body: `# Identifying and reconstructing arguments

Real arguments are messy — buried in prose, padded with repetition, missing pieces. **Reconstructing** an argument means restating it clearly as premises and a conclusion.

## Steps

1. Find the **conclusion** (the main point).
2. Find the stated **premises**.
3. Strip out noise — repetition, asides, rhetorical questions.
4. Supply any **implicit (unstated) premise** the argument needs.

## Implicit premises

Most everyday arguments leave assumptions unstated. "Socrates is a man, so Socrates is mortal" relies on the missing premise **"All men are mortal."** An argument with a suppressed premise is called an *enthymeme*. Surfacing the hidden premise is often where the real evaluation begins — because the hidden premise is frequently the weak one.

Advertising runs on enthymemes. A long-running gum campaign claimed "four out of five dentists surveyed recommend sugarless gum for their patients who chew gum." The unstated — and weak — premise is that *you* should therefore chew it, which only follows if you assume what dentists advise for gum-chewers applies to you and that the survey was representative. Naming that buried assumption is exactly where evaluation starts.

## Be accurate first

Reconstruct what the author *actually* argued before you judge it. Adding a premise to make the argument work is fair; adding one to make it look foolish is not.`,
  },
  {
    slug: "diagramming-arguments",
    title: "Diagramming argument structure",
    weekNumber: 1,
    blurb: "Mapping how premises combine: linked, convergent, and serial.",
    lectureTitle: "1.6 Diagramming argument structure",
    body: `# Diagramming argument structure

Once an argument has several premises, a **diagram** shows how they fit together. Number each claim, then map the support with arrows pointing to what each claim supports.

## Linked premises

Premises are **linked** when they work only *together* — remove one and the support collapses.

> (1) All mammals are warm-blooded. (2) Whales are mammals. Therefore (3) whales are warm-blooded.

Neither (1) nor (2) alone supports (3); they are linked: (1)+(2) → (3).

## Convergent premises

Premises are **convergent** when each independently supports the conclusion.

> (1) The restaurant is cheap. (2) It is close by. Therefore (3) we should eat there.

Either reason stands on its own: (1) → (3) and (2) → (3).

## Serial structure

A claim can be the conclusion of one step and a premise of the next: (1) → (2) → (3). Diagrams make these chains — and any gaps in them — visible.`,
  },
  {
    slug: "standardizing-charity",
    title: "Standardizing and charitable interpretation",
    weekNumber: 1,
    blurb: "Writing arguments in standard form; the principle of charity.",
    lectureTitle: "1.7 Standardizing and charitable interpretation",
    body: `# Standardizing and charitable interpretation

**Standardizing** is rewriting an argument as a clean, numbered list of premises followed by the conclusion — the canonical form for analysis.

## Standard form

> P1. If it is raining, the game is canceled.
> P2. It is raining.
> C. Therefore, the game is canceled.

Every premise on its own line; the conclusion marked clearly. Standard form removes ambiguity about what supports what.

## The principle of charity

When an argument is unclear or could be read several ways, interpret it in its **strongest reasonable form**. Do not defeat a weak version the author never intended.

## The straw man warning

Violating charity produces the **straw man**: attacking a distorted, weaker version of someone's position. Charity is both an intellectual virtue and a practical safeguard — if you refute the strongest version, your conclusion is secure; if you only beat a straw man, you have proven nothing.

A long-running real example: critics of evolution have often attacked the claim that "humans descended from monkeys." But that is a straw man — the actual scientific claim is that humans and modern monkeys share a *common ancestor*. Refuting the cartoon version leaves the real theory completely untouched.`,
  },

  // Week 2 — Logic and reasoning
  {
    slug: "deductive-vs-inductive",
    title: "Deductive vs. inductive reasoning",
    weekNumber: 2,
    blurb: "Certainty vs. probability: the two great families of argument.",
    lectureTitle: "2.1 Deductive vs. inductive reasoning",
    body: `# Deductive vs. inductive reasoning

Arguments come in two great families, distinguished by **how much support** the premises are meant to give the conclusion.

## Deductive

A **deductive** argument aims for *certainty*: if the premises are true, the conclusion **must** be true. The support is all-or-nothing.

> All humans are mortal. Socrates is human. Therefore Socrates is mortal.

## Inductive

An **inductive** argument aims for *probability*: if the premises are true, the conclusion is **likely**, but not guaranteed.

> Every swan observed so far has been white. So the next swan will be white.

Strong inductive arguments can still have true premises and a false conclusion. For centuries Europeans had only ever seen white swans, so "all swans are white" looked airtight — until 1697, when the Dutch explorer Willem de Vlamingh encountered **black swans** in Western Australia. A single observation overturned a conclusion built on thousands.

## Telling them apart

Ask: **does the arguer intend the conclusion to follow necessarily, or only probably?** That intention — not the topic — decides which standards (validity vs. strength) you apply.`,
  },
  {
    slug: "validity-and-soundness",
    title: "Validity and soundness",
    weekNumber: 2,
    blurb: "Form vs. truth: the two terms students confuse most.",
    lectureTitle: "2.2 Validity and soundness",
    body: `# Validity and soundness

These two terms apply to **deductive** arguments and are constantly confused.

## Validity

An argument is **valid** when its *form* guarantees the conclusion: *if* the premises were true, the conclusion *could not* be false. Validity is about structure, not facts.

> All cats are reptiles. Socrates is a cat. Therefore Socrates is a reptile.

This is **valid** — and has false premises. Validity ignores whether the premises are actually true.

## Soundness

An argument is **sound** when it is **valid AND all its premises are true**. Only sound arguments establish their conclusions.

## The combinations

- Valid + all true premises = **sound**; conclusion guaranteed true.
- Valid + a false premise = unsound; conclusion may be true or false.
- Invalid = unsound regardless of the premises.

A valid argument can have a false conclusion (when a premise is false). A *sound* one cannot.

A historical case makes this concrete: for almost 2,000 years people reasoned, "Heavier objects fall faster; a cannonball is heavier than a musket ball; therefore the cannonball lands first." The argument is perfectly **valid** — but its first premise is false, as Galileo argued around 1590, so the whole thing is **unsound**. Valid form is no protection when a premise is wrong.`,
  },
  {
    slug: "categorical-logic-syllogism",
    title: "Categorical logic and the syllogism",
    weekNumber: 2,
    blurb: "Reasoning about classes with All / No / Some statements.",
    lectureTitle: "2.3 Categorical logic and the syllogism",
    body: `# Categorical logic and the syllogism

**Categorical logic** reasons about classes of things using four statement forms:

- **A:** All S are P.
- **E:** No S are P.
- **I:** Some S are P.
- **O:** Some S are not P.

## The categorical syllogism

A **syllogism** draws a conclusion from two categorical premises that share a middle term.

> All mammals are animals. All dogs are mammals. Therefore all dogs are animals. (**valid**)

## Validity by form

Validity depends only on the arrangement of terms. This form is invalid:

> All cats are animals. All dogs are animals. Therefore all dogs are cats.

Both premises are true and the conclusion false — so the *form* itself is broken.

## Venn diagrams

Three overlapping circles let you test any syllogism: diagram the premises, then check whether the conclusion is already forced. If you must add anything to make it true, the syllogism is invalid.`,
  },
  {
    slug: "propositional-logic-truth-tables",
    title: "Propositional logic and truth tables",
    weekNumber: 2,
    blurb: "Connectives, the conditional, and the formal fallacies.",
    lectureTitle: "2.4 Propositional logic and truth tables",
    body: `# Propositional logic and truth tables

**Propositional logic** combines whole statements with connectives:

- $\\neg P$ — not $P$
- $P \\wedge Q$ — $P$ and $Q$
- $P \\vee Q$ — $P$ or $Q$
- $P \\to Q$ — if $P$ then $Q$

## The conditional

$P \\to Q$ is **false only when $P$ is true and $Q$ is false.** "If you mow the lawn, I'll pay you" is broken only if you mow *and* I do not pay.

## Valid forms

- **Modus ponens:** $P \\to Q$, $P$, therefore $Q$. ✓
- **Modus tollens:** $P \\to Q$, $\\neg Q$, therefore $\\neg P$. ✓

## Formal fallacies

- **Affirming the consequent:** $P \\to Q$, $Q$, therefore $P$. ✗
- **Denying the antecedent:** $P \\to Q$, $\\neg P$, therefore $\\neg Q$. ✗

A **truth table** lists every combination of truth values and settles validity mechanically: an argument is valid if no row makes the premises true while the conclusion is false.

Affirming the consequent shows up in real life. "If a patient has this disease ($P$), the test comes back positive ($Q$). The test came back positive ($Q$). Therefore the patient has the disease ($P$)." That last step is the fallacy: other things cause positive results too (false positives), which is exactly why one positive on a screening test triggers a follow-up rather than immediate treatment.`,
  },
  {
    slug: "inductive-strength-generalization",
    title: "Inductive strength and generalization",
    weekNumber: 2,
    blurb: "What makes a sample-to-population inference strong or weak.",
    lectureTitle: "2.5 Inductive strength and generalization",
    body: `# Inductive strength and generalization

Inductive arguments are not valid or invalid — they are **strong** or **weak**, by degree.

## Inductive generalization

The most common inductive move infers a claim about a whole population from a sample:

> 800 of 1,000 surveyed voters favor the measure, so about 80% of all voters do.

## What makes it strong

- **Sample size:** larger samples support firmer conclusions.
- **Representativeness:** the sample must mirror the population.
- **Random selection:** guards against hidden bias.

## Hasty generalization

Drawing a sweeping conclusion from a sample that is **too small or unrepresentative** is the *hasty generalization*. "My two friends who smoke are healthy, so smoking is harmless" generalizes from a tiny, biased sample.

## Biased samples

The classic disaster is the **1936 *Literary Digest* poll**. It tallied about 2.4 million mailed-in responses — an enormous sample — and confidently predicted Alf Landon would beat Franklin Roosevelt. Roosevelt then won 46 of the 48 states. The ballots had been drawn from telephone and automobile-registration lists, which in the Depression skewed wealthy. Meanwhile George Gallup's far smaller *representative* poll called it correctly. Size cannot rescue a systematically skewed sample.`,
  },
  {
    slug: "analogical-reasoning",
    title: "Analogical reasoning",
    weekNumber: 2,
    blurb: "Arguing from similarity — and when the analogy breaks down.",
    lectureTitle: "2.6 Analogical reasoning",
    body: `# Analogical reasoning

An **argument from analogy** concludes that because two things are alike in some respects, they are probably alike in another.

> A new drug cured the disease in mice; mice and humans are physiologically similar; so it may cure the disease in humans.

## Evaluating an analogy

The argument is stronger when:

- The cases share **many** similarities.
- The similarities are **relevant** to the conclusion.
- There are **few relevant differences (disanalogies)**.
- The conclusion is **modest** relative to the similarities.

## Relevance is key

Surface similarities do not help. Mice and humans sharing a *hairless* trait is irrelevant to drug response; shared *metabolism* is highly relevant.

## False analogy

A **false analogy** rests on similarities that are superficial or irrelevant, or it ignores a crucial difference. "Running a country is just like running a business" breaks down because citizens are not customers and governments do not seek profit.

The stakes can be deadly. In the late 1950s **thalidomide** was sold to pregnant women for morning sickness, reassured in part by animal testing. But the animal-to-human analogy concealed a crucial difference in how the drug affected a developing fetus, and more than 10,000 children were born with severe limb defects before it was withdrawn around 1961. An analogy is only as trustworthy as the relevant *differences* it overlooks.`,
  },
  {
    slug: "causal-reasoning-mills-methods",
    title: "Causal reasoning and Mill's methods",
    weekNumber: 2,
    blurb: "Inferring causes, and why correlation is not causation.",
    lectureTitle: "2.7 Causal reasoning and Mill's methods",
    body: `# Causal reasoning and Mill's methods

Establishing that A **causes** B is among the hardest reasoning tasks. John Stuart Mill described systematic methods for inferring causes.

## Mill's methods

- **Method of Agreement:** if every case of the effect shares one prior factor, that factor is a likely cause.
- **Method of Difference:** if two cases differ in only one factor and only one shows the effect, that factor is the likely cause.
- **Joint Method:** combine agreement and difference.
- **Method of Concomitant Variation:** when the candidate cause varies, the effect varies in step.

## Correlation is not causation

Two things moving together may share a **common cause** (ice-cream sales and drownings both rise with summer heat) or be pure coincidence.

## Confounding

A **confounder** is a hidden third variable that influences both. The remedy is a **controlled experiment**: change one factor, hold everything else fixed, and watch the effect.

## A real detective story

In **1854**, cholera was killing people in London's Soho. Physician **John Snow** mapped the deaths and found they clustered around a single public water pump on Broad Street, while workers at a nearby brewery who drank their own supply were spared (Mill's Method of Difference at work). He had the pump handle removed and the outbreak subsided — strong evidence that cholera spread through contaminated water, not "bad air," decades before germ theory was accepted.`,
  },

  // Week 3 — Fallacies, bias, and rhetoric
  {
    slug: "fallacies-of-relevance",
    title: "Informal fallacies of relevance",
    weekNumber: 3,
    blurb: "Premises that persuade but are logically beside the point.",
    lectureTitle: "3.1 Informal fallacies of relevance",
    body: `# Informal fallacies of relevance

A **fallacy of relevance** offers premises that are psychologically persuasive but logically beside the point.

## Common types

- **Ad hominem:** attacking the person rather than their argument. "Don't trust her climate data — she drives an SUV."
- **Straw man:** distorting an opponent's view to attack it more easily.
- **Appeal to force (ad baculum):** backing a claim with a threat.
- **Appeal to pity (ad misericordiam):** substituting sympathy for evidence.
- **Red herring:** changing the subject to a distracting but irrelevant issue.
- **Appeal to the people (ad populum):** "everyone believes it, so it must be true."

## Why they work

Each swaps a real reason for an emotional or social pressure. The test is always the same: **does this premise actually bear on whether the conclusion is true?** If it only bears on how we *feel*, it is a fallacy of relevance.

These tactics are sometimes deployed on purpose. As evidence linking smoking to cancer mounted, the tobacco industry's strategy — captured in a 1969 internal Brown & Williamson memo stating "Doubt is our product" — was to attack the researchers and muddy the debate rather than rebut the data. Distracting from an argument is usually easier than answering it, which is exactly why fallacies of relevance are so common.`,
  },
  {
    slug: "fallacies-weak-induction",
    title: "Fallacies of weak induction",
    weekNumber: 3,
    blurb: "Relevant premises that are simply too weak to support the claim.",
    lectureTitle: "3.2 Fallacies of weak induction",
    body: `# Fallacies of weak induction

Here the premises *are* relevant, but they are **too weak** to support the conclusion.

## Common types

- **Hasty generalization:** a conclusion drawn from too small or biased a sample.
- **Post hoc ergo propter hoc:** "A happened before B, so A caused B."
- **Slippery slope:** claiming one small step inevitably leads to an extreme outcome, with no support for each link.
- **Weak analogy:** an analogy resting on irrelevant similarities.
- **Appeal to ignorance (ad ignorantiam):** "No one has proven it false, so it is true."
- **Appeal to unqualified authority:** citing a celebrity or non-expert.

## The common thread

The reasoning *points* in the right direction but does not travel far enough. Post hoc, for example, mistakes mere sequence for causation — the rooster crows before sunrise but does not cause it.

The post hoc fallacy fueled a real public-health crisis. Early signs of autism often become noticeable around the same age children receive the MMR vaccine. Because the diagnosis *followed* the shot, many parents concluded the shot had *caused* it. But studies tracking millions of children have found no such link — the timing was coincidence, not cause.`,
  },
  {
    slug: "fallacies-presumption-ambiguity",
    title: "Fallacies of presumption and ambiguity",
    weekNumber: 3,
    blurb: "Smuggled assumptions and slippery, shifting language.",
    lectureTitle: "3.3 Fallacies of presumption and ambiguity",
    body: `# Fallacies of presumption and ambiguity

These fallacies smuggle in an unwarranted assumption or exploit slippery language.

## Fallacies of presumption

- **Begging the question (circular reasoning):** the conclusion is hidden among the premises. "The Bible is true because it is the word of God, which we know because the Bible says so."
- **Complex (loaded) question:** a question presupposing something unproven. "Have you stopped cheating on tests?"
- **False dilemma:** presenting only two options when many exist. A famous case came after the September 11 attacks, when President George W. Bush told the world, "Either you are with us, or you are with the terrorists" — collapsing a whole spectrum of positions into just two.
- **Suppressed evidence:** ignoring relevant facts that undercut the conclusion.

## Fallacies of ambiguity

- **Equivocation:** shifting a key word's meaning mid-argument. "Nothing is better than happiness; a cheese sandwich is better than nothing; so a sandwich is better than happiness."
- **Amphiboly:** ambiguity arising from grammar or sentence structure.

The cure for ambiguity is **defining your terms** and holding their meaning fixed throughout.`,
  },
  {
    slug: "rhetoric-persuasion-spin",
    title: "Rhetoric, persuasion, and spin",
    weekNumber: 3,
    blurb: "Persuasive force vs. logical force, and how spin exploits the gap.",
    lectureTitle: "3.4 Rhetoric, persuasion, and spin",
    body: `# Rhetoric, persuasion, and spin

**Rhetoric** is the art of persuasion. It is not inherently bad — but persuasive force and logical force are different things, and **spin** exploits the gap between them.

## Rhetorical devices

- **Euphemism / dysphemism:** softening or harshening language to steer feeling. "Collateral damage" for civilian deaths and "enhanced interrogation" for techniques widely described as torture are real euphemisms that made grim realities sound clinical.
- **Loaded (emotive) language:** word choices that carry judgment — "freedom fighter" vs. "terrorist."
- **Weasel words:** vague qualifiers — "studies suggest," "up to," "may help."
- **Innuendo:** implying a claim without actually stating it.

## Spin

**Spin** presents facts selectively to create a misleading impression while remaining technically accurate.

## The defense

Separate the **content** of a claim from its **packaging**. Restate the claim in plain, neutral words and ask whether the *evidence* still supports it. If the persuasive power vanishes once the loaded language is gone, it was rhetoric, not reason.`,
  },
  {
    slug: "cognitive-biases-motivated-reasoning",
    title: "Cognitive biases and motivated reasoning",
    weekNumber: 3,
    blurb: "Systematic mental errors and reasoning driven by what we want.",
    lectureTitle: "3.5 Cognitive biases and motivated reasoning",
    body: `# Cognitive biases and motivated reasoning

Even careful reasoners are pushed off course by **cognitive biases** — systematic errors in how the mind processes information.

## Common biases

- **Confirmation bias:** seeking and favoring evidence that supports what you already believe.
- **Anchoring:** over-relying on the first number or fact you encounter.
- **Availability heuristic:** judging probability by how easily examples come to mind. After the September 11 attacks many Americans were so afraid of flying that they drove instead; researchers later estimated this shift to far more dangerous roads caused roughly 1,500 additional traffic deaths over the following year.
- **Sunk cost fallacy:** continuing something because of past investment. It is sometimes called the **"Concorde fallacy,"** after Britain and France kept funding the supersonic jet long after it was clear it would never turn a profit — precisely because they had already spent so much.
- **Dunning–Kruger effect:** the least skilled overestimating their competence.

## Motivated reasoning

**Motivated reasoning** is biased thinking driven by what we *want* to be true. We apply harsh scrutiny to unwelcome claims and wave the welcome ones through.

## Defenses

Actively seek **disconfirming** evidence, consider the opposite, separate your identity from your beliefs, and welcome being shown wrong. The first bias to watch for is the conviction that *you* are unbiased.`,
  },
  {
    slug: "language-definition-vagueness",
    title: "Language, definition, and vagueness",
    weekNumber: 3,
    blurb: "Ambiguity vs. vagueness; kinds of definitions; verbal disputes.",
    lectureTitle: "3.6 Language, definition, and vagueness",
    body: `# Language, definition, and vagueness

Clear reasoning needs clear language. Two failures recur: **ambiguity** and **vagueness**.

## Ambiguity vs. vagueness

- **Ambiguous:** a term has *multiple distinct meanings*. "bank" (riverside or financial).
- **Vague:** a term has *fuzzy borders*. "tall," "rich," "soon" — there is no sharp line.

## Kinds of definition

- **Lexical:** reports standard usage (a dictionary definition).
- **Stipulative:** assigns a meaning for the discussion at hand.
- **Précising:** sharpens a vague term for a purpose ("adult = 18 or older").
- **Persuasive:** slips an evaluation into a definition ("abortion is the murder of an innocent").

## Why it matters

Many disputes are **merely verbal** — people using the same word for different things, or arguing over where to draw a vague line. Before debating whether a hot dog is a sandwich, agree on what "sandwich" means.

This is exactly what happened to **Pluto**. In 2006 the International Astronomical Union adopted a *précising* definition of "planet" requiring a body to have "cleared its orbital neighborhood." Pluto had not, so it was reclassified as a dwarf planet. Nothing about Pluto itself changed — only the definition did. Much of the public outcry was a verbal dispute over a word, not a discovery about the solar system.`,
  },
  {
    slug: "credibility-sources-testimony",
    title: "Credibility, sources, and testimony",
    weekNumber: 3,
    blurb: "Judging the people and sources we rely on for what we know.",
    lectureTitle: "3.7 Credibility, sources, and testimony",
    body: `# Credibility, sources, and testimony

Most of what we know comes from **testimony** — other people's claims. Evaluating sources is a core critical-thinking skill.

## Judging a source

- **Expertise:** is the source genuinely qualified *in this field*?
- **Bias / conflict of interest:** does the source gain from your belief?
- **Track record:** has the source been reliable before?
- **Corroboration:** do independent sources agree?
- **Primary vs. secondary:** is this firsthand, or a report of a report?

## Appeal to authority — good and bad

Trusting a **qualified** expert within their field is reasonable. The fallacy is the **appeal to inappropriate authority**: citing a celebrity, a non-expert, or an expert speaking outside their specialty.

## Lateral reading

Do not evaluate a source by staring at the source itself. **Read laterally:** open new tabs and check what *other* independent, credible sources say about it. When Stanford researchers compared how professional fact-checkers, historians, and college students judged unfamiliar websites, the fact-checkers were both faster and more accurate — precisely because they left the page to check it against other sources instead of scrutinizing its design and "About" page.`,
  },

  // Week 4 — Applied reasoning and capstone
  {
    slug: "probability-statistical-reasoning",
    title: "Probability and statistical reasoning",
    weekNumber: 4,
    blurb: "Thinking in degrees; base rates; how statistics mislead.",
    lectureTitle: "4.1 Probability and statistical reasoning",
    body: `# Probability and statistical reasoning

Good critical thinking is **probabilistic** — most claims are matters of degree, not certainty.

## Basic rules

- A probability is a number in $[0, 1]$.
- $P(\\text{not } A) = 1 - P(A)$.
- For independent events, $P(A \\text{ and } B) = P(A) \\cdot P(B)$.

## The base rate

The **base rate** is how common something is to begin with. Ignoring it is the **base rate fallacy**: a test that is "99% accurate" for a disease only 1 in 10,000 people have will still flag mostly *healthy* people, because the healthy vastly outnumber the sick.

## How statistics mislead

- **Misleading averages:** a mean dragged by outliers; ask for the median.
- **Cherry-picked baselines:** "up 40% since [a conveniently chosen low point]."
- **Relative vs. absolute risk:** "doubles your risk" — from 1 in a million to 2 in a million.

Always ask: *out of how many, and compared to what?*

Getting this wrong can be catastrophic. In 1999 the British solicitor **Sally Clark** was convicted of murdering her two infant sons after an expert testified that the odds of two cot deaths (SIDS) in one family were "1 in 73 million." That figure wrongly assumed the two deaths were independent and ignored the base rate of double SIDS versus double murder. The statistics were so badly misused that her conviction was quashed in 2003 — and the case became a textbook warning about probability in the courtroom.`,
  },
  {
    slug: "evaluating-evidence-science",
    title: "Evaluating evidence and scientific claims",
    weekNumber: 4,
    blurb: "Falsifiability, the evidence hierarchy, and pseudoscience red flags.",
    lectureTitle: "4.2 Evaluating evidence and scientific claims",
    body: `# Evaluating evidence and scientific claims

Science is our most reliable method for testing claims about the world — once its standards are understood.

## Hallmarks of good evidence

- **Falsifiability:** a genuine claim rules something out; an *unfalsifiable* claim ("an invisible, undetectable dragon") predicts nothing.
- **Controlled comparison:** experiments isolate the variable of interest.
- **Replication:** results that cannot be reproduced are provisional.
- **Peer review:** scrutiny by other experts — helpful, though not a guarantee.

## The hierarchy of evidence

Anecdotes < case studies < observational studies < randomized controlled trials < systematic reviews. A single dramatic story is the weakest evidence, however compelling.

## Red flags of pseudoscience

Unfalsifiable claims, reliance on testimonials, conspiracy framing ("they don't want you to know"), no peer review, and immunity to any disconfirming evidence. Extraordinary claims require extraordinary evidence.

## When replication fails

In 1989 two respected chemists, **Fleischmann and Pons**, announced they had achieved **"cold fusion"** — nuclear fusion at room temperature — in a tabletop apparatus. It promised limitless clean energy and made headlines worldwide. But laboratories that tried to reproduce the result could not, and the claim collapsed. Science worked exactly as it should: an extraordinary claim was put to the test of replication and rejected when the evidence failed to hold.`,
  },
  {
    slug: "decision-making-uncertainty",
    title: "Decision-making under uncertainty",
    weekNumber: 4,
    blurb: "Expected value, risk, and the traps that derail good choices.",
    lectureTitle: "4.3 Decision-making under uncertainty",
    body: `# Decision-making under uncertainty

Reasoning is not only about what is *true* — it is about what to *do* when outcomes are uncertain.

## Expected value

The **expected value** of an option is each outcome's value weighted by its probability, then summed.

> A \\$1 lottery ticket pays \\$1,000,000 with probability 1 in 10,000,000. Expected value $= \\frac{1{,}000{,}000}{10{,}000{,}000} = \\$0.10$ — far less than the \\$1 cost.

## Rational choice

Compare options by expected value, but also weigh your **risk tolerance**: a guaranteed \\$50 may beat a coin-flip for \\$110 if you cannot afford to lose.

## Common traps

- **Sunk cost:** basing choices on unrecoverable past costs.
- **Loss aversion:** weighting losses more heavily than equal gains — a pattern documented by psychologists **Daniel Kahneman and Amos Tversky**, whose research showed most people feel the pain of losing $100 more sharply than the pleasure of gaining $100. Kahneman won the 2002 Nobel Prize in economics for this body of work.
- **Neglecting opportunity cost:** ignoring what you give up by choosing.

A decision should be judged by the **quality of reasoning given what you knew**, not only by how it happened to turn out.`,
  },
  {
    slug: "moral-value-reasoning",
    title: "Moral and value reasoning",
    weekNumber: 4,
    blurb: "The is–ought gap and the structure of moral arguments.",
    lectureTitle: "4.4 Moral and value reasoning",
    body: `# Moral and value reasoning

Not all reasoning is about facts. **Value reasoning** concerns what is good, right, or ought to be done.

## Is vs. ought

- A **descriptive (factual)** claim says how the world *is*: "Capital punishment does not reduce crime."
- A **normative (value)** claim says how it *ought* to be: "Capital punishment is wrong."

You cannot derive an *ought* from an *is* alone — this is the **is–ought gap**, first pointed out by the philosopher **David Hume** in 1739. A moral argument needs at least one value premise.

## Structure of moral arguments

> P1. (Value) Causing unnecessary suffering is wrong.
> P2. (Fact) This practice causes unnecessary suffering.
> C. Therefore this practice is wrong.

Evaluate both kinds of premise: are the facts right, *and* is the value principle defensible?

## Tools

Test value claims with **consistency** (would you accept it applied to you?), **counterexamples**, and **thought experiments**. Moral reasoning can be rigorous even without mathematical certainty.`,
  },
  {
    slug: "reasoning-in-writing",
    title: "Reasoning in writing and argumentative essays",
    weekNumber: 4,
    blurb: "Thesis, structure, counterarguments, and signposting.",
    lectureTitle: "4.5 Reasoning in writing and argumentative essays",
    body: `# Reasoning in writing and argumentative essays

Writing is reasoning made visible. An **argumentative essay** defends a claim with structured support.

## The thesis

The **thesis** is the single main claim the whole essay defends. It should be specific, contestable, and clear. "Social media harms teen mental health and should be age-restricted" is a thesis; "Social media is interesting" is not.

## Structure

1. **Introduction** that states the thesis.
2. **Body paragraphs**, each a premise: claim, evidence, reasoning.
3. **Counterarguments** acknowledged and answered.
4. **Conclusion** that the body has earned.

## Addressing objections

A strong essay states the **strongest opposing view** (charitably) and responds to it. Ignoring obvious objections signals weak reasoning.

## Signposting

Use premise and conclusion indicators — *because, therefore, however, nevertheless* — so the reader can follow the logical skeleton. If you cannot outline your essay as premises and a conclusion, the argument is not finished.`,
  },
  {
    slug: "detecting-misinformation",
    title: "Detecting misinformation and manipulation",
    weekNumber: 4,
    blurb: "Warning signs and verification techniques for the online world.",
    lectureTitle: "4.6 Detecting misinformation and manipulation",
    body: `# Detecting misinformation and manipulation

Misinformation is false or misleading content; **disinformation** is misinformation spread deliberately. Both thrive online.

## Warning signs

- **Emotional bait:** content engineered to provoke outrage or fear.
- **Missing or vague sourcing:** "experts say," with no link and no name.
- **Manipulated context:** a real photo or quote ripped from its setting. After almost every major hurricane, a doctored photo of a **shark swimming on a flooded highway** goes viral as "breaking news" — the same fake image, recycled storm after storm for over a decade.
- **Too good (or bad) to be true:** it confirms your side perfectly.

## Techniques

- **Lateral reading:** leave the page and check independent sources.
- **Check the original:** trace a claim back to its primary source.
- **Reverse image search:** verify when and where an image really came from.
- **Consider the incentive:** who benefits if you believe and share this?

## Defenses

Slow down before sharing — virality exploits speed. Distinguish a **headline** from the **evidence**. And apply the same scrutiny to content you *agree* with, because that is exactly where your guard is lowest.`,
  },
  {
    slug: "critical-thinking-across-domains",
    title: "Applying critical thinking across domains",
    weekNumber: 4,
    blurb: "How reasoning takes a different shape in each field — and transfers.",
    lectureTitle: "4.7 Applying critical thinking across domains",
    body: `# Applying critical thinking across domains

Critical thinking is a **general** skill, but it takes a different shape in each domain.

## Domain by domain

- **Health:** weigh relative vs. absolute risk; separate correlation from causation in studies.
- **Politics:** watch for loaded language, false dilemmas, and tribal motivated reasoning.
- **Personal finance:** beware sunk costs, base-rate neglect, and "get rich quick" appeals.
- **Science news:** a single study is not settled science; check for replication.
- **Everyday life:** notice when a salesperson frames a false dilemma or anchors a price.

## Transfer

The hard part is **transfer** — using a skill learned in one context in a new one. It does not happen automatically; you build it by deliberately asking the core questions everywhere: *What is the claim? What is the evidence? What is assumed? What is left out?*

## The habit

Expertise in a field does not immunize anyone against fallacies. The goal is to make critical questioning a reflex, not a special occasion.`,
  },
  {
    slug: "capstone-synthesis",
    title: "Capstone synthesis",
    weekNumber: 4,
    blurb: "Putting the whole toolkit to work on a real-world claim.",
    lectureTitle: "4.8 Capstone synthesis",
    body: `# Capstone synthesis

The capstone ties the whole course together: take a real claim from the wild and evaluate it end to end.

## A worked example

> "A new study shows students who use our app score 20% higher. Don't let your child fall behind — the data doesn't lie."

Apply the toolkit:

1. **Identify the argument** — conclusion: buy the app; premises: the study and the appeal.
2. **Classify the reasoning** — inductive, from a study to a recommendation.
3. **Check the evidence** — sample size? control group? who funded it? 20% relative to what?
4. **Spot fallacies and rhetoric** — appeal to fear ("fall behind"), the "data doesn't lie" thought-stopper, post hoc risk.
5. **Consider bias** — the seller's conflict of interest; your own hope that it works.
6. **Reach a verdict** — proportion your belief to the strength of the evidence.

## The standard

A claim is worth believing when the **premises are true** and the **reasoning is valid or strong**. That single test — applied honestly, to friend and foe alike — is critical thinking.`,
  },
];

type SeedAssignment = {
  kind: "homework" | "test" | "midterm" | "final";
  title: string;
  weekNumber: number;
  isTimed: boolean;
  timeLimitMinutes: number | null;
  instructions: string;
  problems: Array<{
    topicSlug: string;
    prompt: string;
    correctAnswer: string;
    explanation: string;
    hint?: string;
  }>;
};

const ASSIGNMENTS: SeedAssignment[] = [
  // Week 1
  {
    kind: "homework",
    title: "Homework 1.1 — Claims and arguments",
    weekNumber: 1,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice. Explain your reasoning in the answer box.",
    problems: [
      { topicSlug: "what-is-critical-thinking", prompt: "A celebrity says a supplement 'completely changed her life,' and thousands buy it on her word. Her fans are certain; you're skeptical. Name two specific things you'd want to find out before believing the supplement actually works, and explain why her confidence and huge following don't settle whether it does.", correctAnswer: "You'd want evidence the supplement itself causes the benefit — e.g. controlled studies comparing people who took it with people who didn't, and whether she's paid to promote it. Confidence and follower count measure popularity, not truth: large numbers of people can sincerely believe something false, so neither tells you whether the supplement works.", explanation: "Believing a claim should track evidence that it's true, not how confident or popular its source is." },
      { topicSlug: "claims-beliefs-truth", prompt: "A politician declares, 'Crime is out of control in this city.' Before you agree or disagree, what would you have to pin down to turn this into something that could actually be checked as true or false — and why can't it be tested as stated?", correctAnswer: "You'd have to make it specific and measurable: which crimes, compared to what time period, by what measure (reported incidents, victim surveys, rate per capita). As stated, 'out of control' is too vague to be confirmed or refuted by any fact; only once it's defined against actual numbers does it become a checkable claim.", explanation: "A claim can only be judged true or false once it's made specific enough to be checked against evidence." },
      { topicSlug: "arguments-vs-nonarguments", prompt: "A bank ad says, 'You should switch to us — thousands of people already have.' They have offered a reason for their conclusion. Does that reason actually support the conclusion that YOU should switch? Explain what it does and doesn't show.", correctAnswer: "It's offered as support, but it's weak support: that many people switched shows the bank is popular, not that it's better for you. People switch for reasons — marketing, herd behavior — that have nothing to do with whether it suits your needs. A reason being given doesn't make it a good reason for the conclusion.", explanation: "Evaluating an argument means asking whether the reason actually establishes the conclusion, not just whether a reason was given." },
    ],
  },
  {
    kind: "homework",
    title: "Homework 1.2 — Structure of arguments",
    weekNumber: 1,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "premises-and-conclusions", prompt: "A coworker argues: 'We must be understaffed — everyone's been complaining about their workload.' Walk through whether the complaints really establish that the team is understaffed, or whether the same complaints could be true even if staffing is fine.", correctAnswer: "The complaints are evidence but don't establish understaffing on their own. Heavy workloads can come from poor scheduling, inefficiency, a temporary crunch, or high expectations — all possible with adequate staff. To get from 'people are complaining' to 'we're understaffed,' you'd have to rule out those other explanations, so the conclusion is plausible but not yet established.", explanation: "A conclusion is only established when the premise rules out the competing explanations for the same evidence." },
      { topicSlug: "identifying-reconstructing-arguments", prompt: "A toothpaste ad argues: 'Ours is best — it's the brand most dentists recommend.' For this to actually support 'best for you,' something has to be assumed about those recommendations. Spell out that hidden assumption, then say whether you'd actually trust it.", correctAnswer: "It assumes dentists recommend it because it's superior — and that 'most recommend' isn't just an artifact of how the survey was run (dentists may have named several brands, or been asked a leading question). The assumption is shaky: without knowing how the recommendation was measured or whether better options existed, 'most recommended' doesn't establish 'best for you.'", explanation: "Surfacing an argument's unstated assumption lets you test whether the reasoning actually holds up." },
      { topicSlug: "diagramming-arguments", prompt: "A prosecutor argues: 'The defendant is guilty — his fingerprints were on the weapon, and three witnesses saw him flee.' The defense then proves the fingerprints were planted. How much of the argument survives, and what does that tell you about which reason was doing the heavy lifting?", correctAnswer: "The witness testimony still stands, so the case is weakened but not destroyed — the two reasons support the conclusion fairly independently. It tells you the fingerprints weren't the sole load-bearing reason; knocking out one independent support lowers the strength of the case without collapsing it entirely.", explanation: "When reasons support a conclusion independently, removing one weakens the case but doesn't necessarily break it." },
      { topicSlug: "standardizing-charity", prompt: "An opponent says, 'People who skip college do fine — look at Bill Gates.' It's tempting to dismiss this as one cherry-picked example. Before criticizing, restate their underlying point in its strongest reasonable form — then give your real objection to that stronger version.", correctAnswer: "Strongest version: 'A degree isn't strictly necessary for success; some people thrive without one,' which is defensible. The real objection isn't the Gates anecdote but that rare outliers don't tell you the typical outcome — what happens on average to people who skip college matters far more than one billionaire. Engaging the strong version targets the actual claim instead of an easy caricature.", explanation: "Steelmanning forces your objection to engage the opponent's best case, not a weak distortion of it." },
    ],
  },
  {
    kind: "test",
    title: "Week 1 Test",
    weekNumber: 1,
    isTimed: true,
    timeLimitMinutes: 30,
    instructions: "Timed. 30 minutes. Pasting is disabled.",
    problems: [
      { topicSlug: "claims-beliefs-truth", prompt: "A horoscope says, 'Today you may face a challenge, but an opportunity could also arise.' Describe a day on which this prediction would turn out FALSE. Use your answer to explain why the horoscope isn't really telling you anything.", correctAnswer: "There's essentially no such day — it's hedged so that almost anything ('may,' 'could,' both a challenge and an opportunity) counts as fulfilling it. Because no possible day could prove it false, it makes no real prediction and gives you no information about your day.", explanation: "A claim that no possible observation could prove false carries no real information." },
      { topicSlug: "arguments-vs-nonarguments", prompt: "Everyone agrees the company's sales dropped. The CEO tells investors, 'Sales dropped because a competitor undercut our prices.' A board member counters, 'No — sales dropped because our product quality slipped.' What are they really disagreeing about, and what evidence would help settle it?", correctAnswer: "They don't disagree that sales dropped — they're offering competing explanations for WHY. To settle it you'd look at evidence that distinguishes the causes: did customers cite price or quality, did sales fall most where the competitor undercut, did quality complaints rise? The dispute is about cause, so it's decided by evidence bearing on cause, not by restating that sales fell.", explanation: "Disputes over the explanation of an agreed fact are settled by evidence that discriminates between the rival causes." },
      { topicSlug: "premises-and-conclusions", prompt: "A headline reads: 'The streets are wet, so the city's new flood plan is failing.' Lay out what's being concluded and what it rests on — then judge whether wet streets are anywhere near enough to get there.", correctAnswer: "Conclusion: the flood plan is failing; support: the streets are wet. Wet streets are nowhere near enough — ordinary rain wets streets regardless of any flood plan, and 'failing' would require flooding or damage the plan was meant to prevent. The support doesn't reach the conclusion.", explanation: "Identifying the conclusion is only the start; the real test is whether the premise is strong enough to support it." },
      { topicSlug: "premises-and-conclusions", prompt: "Your friend concludes, 'I'll definitely ace the final.' Give one piece of support that would make this a reasonable conclusion and one that wouldn't — and explain what makes the difference.", correctAnswer: "Reasonable support: 'I've scored 95+ on every timed practice final' — relevant evidence of likely performance. Weak support: 'I have a good feeling' or 'I aced the easy first quiz' — a feeling and an unrepresentative early quiz don't bear on the final. The difference is whether the reason is actually relevant evidence for that specific conclusion.", explanation: "Good support must be evidence genuinely relevant to the specific conclusion drawn." },
      { topicSlug: "diagramming-arguments", prompt: "A doctor says, 'You should get this procedure — it will relieve your pain, it's low-risk, and your insurance covers it.' You then learn insurance will NOT cover it. Does the recommendation fall apart? Explain what changes and what doesn't.", correctAnswer: "It doesn't fall apart — pain relief and low risk still support getting it, and those reasons stand independently of cost. What changes is the financial picture, which may affect your decision, but the medical case for the procedure is untouched. Losing one independent reason weakens the overall case without destroying it.", explanation: "Knocking out one independently-supporting reason weakens an argument's strength but leaves the others intact." },
      { topicSlug: "what-is-critical-thinking", prompt: "A student is completely sure her essay's argument is airtight and refuses to reread it; her certainty feels to her like proof the argument is good. Explain why her confidence is not actually a reason to trust the argument — and what would be.", correctAnswer: "Confidence is a feeling, not evidence about the argument's quality — people feel certain of false things all the time, and refusing to reread is exactly how errors survive. What would justify trust is checking the reasoning itself: do the premises hold, does the conclusion follow, can she answer the strongest objection? The test is the argument's content, not how sure she feels.", explanation: "Justification comes from examining the reasoning, not from how confident you feel about it." },
    ],
  },

  // Week 2
  {
    kind: "homework",
    title: "Homework 2.1 — Deduction and validity",
    weekNumber: 2,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "deductive-vs-inductive", prompt: "A detective says, 'The killer had a key, and only three people have keys, so it's one of these three.' A scientist says, 'Every sample of this metal has melted at 1085°C, so this metal always melts at 1085°C.' One conclusion can't be wrong if its reasons are true; the other could still be overturned. Which is which, and what kind of new fact could overturn the second but not the first?", correctAnswer: "The detective's conclusion can't be wrong if its premises hold — if only those three have keys and the killer had one, it must be one of them; the conclusion is already contained in the premises. The scientist's could be overturned by a future sample melting at a different temperature, because it generalizes beyond what's been observed. No new fact threatens the detective's once its premises are granted.", explanation: "Reasoning whose conclusion is contained in its premises is airtight; reasoning that generalizes beyond the evidence stays open to revision." },
      { topicSlug: "deductive-vs-inductive", prompt: "'Every email I've gotten from this address has been spam, so the next one will be too.' How confident should you be in this conclusion, and what single thing would most change how much you trust it?", correctAnswer: "Fairly but not perfectly confident — it generalizes from past cases, so it's probable, not guaranteed; the very next email could break the pattern. What most changes your trust is the sample: ten consistent spam emails justify far more confidence than two, and learning something changed (you just signed up with that sender) could overturn it.", explanation: "Confidence in a generalization should scale with how large and representative the evidence is — and stays defeasible." },
      { topicSlug: "validity-and-soundness", prompt: "Consider: 'Every business that cuts prices gains customers. This store cut prices. So it gained customers.' Suppose the logic is airtight. Is that enough for you to believe it gained customers — and what's the one thing you'd still have to check?", correctAnswer: "No — valid logic only guarantees the conclusion if the premises are actually true. You'd have to check the first premise, and 'every business that cuts prices gains customers' is almost certainly false (cuts can signal trouble, competitors may cut deeper). A valid argument with a false premise can have a false conclusion, so check the premises before believing the conclusion.", explanation: "Valid form alone doesn't make a conclusion true; you must also verify the premises are actually true." },
    ],
  },
  {
    kind: "homework",
    title: "Homework 2.2 — Logical forms",
    weekNumber: 2,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "validity-and-soundness", prompt: "Your friend says, 'My argument is valid, so my conclusion must be true.' Construct a quick example that shows why being valid alone doesn't make a conclusion true.", correctAnswer: "Any valid argument with a false premise works, e.g.: 'All birds can fly; a penguin is a bird; so a penguin can fly.' The logic is valid (the conclusion follows from the premises), but the first premise is false, so the conclusion is false. Validity guarantees a true conclusion only when every premise is also true.", explanation: "Constructing a valid-but-false-premise counterexample shows validity and truth are different things." },
      { topicSlug: "categorical-logic-syllogism", prompt: "Two arguments: (A) 'All doctors have degrees. Sam has a degree. So Sam is a doctor.' (B) 'All doctors have degrees. Sam is a doctor. So Sam has a degree.' Both have believable premises, but only one guarantees its conclusion. Which is safe to rely on, and what goes wrong in the other?", correctAnswer: "(B) is safe — if all doctors have degrees and Sam is a doctor, he must have a degree. (A) goes wrong: having a degree doesn't make you a doctor, since plenty of non-doctors have degrees, so the premises can be true while the conclusion is false. It's the form, not the believable wording, that makes (B) reliable and (A) not.", explanation: "Whether a conclusion is guaranteed depends on the argument's form, not on how plausible the sentences sound." },
      { topicSlug: "propositional-logic-truth-tables", prompt: "A store posts: 'If you spend $50, you get free shipping.' A customer who spent only $40 got free shipping anyway and complains the sign is a lie. Is the store's promise actually broken? Explain what would and wouldn't count as breaking it.", correctAnswer: "No — the promise only says what happens IF you spend $50; it doesn't say that's the only way to get free shipping. It's broken only if someone spends $50 and is denied free shipping. Giving free shipping to a $40 order is a bonus, not a violation — the customer is misreading the conditional as 'only if.'", explanation: "A conditional promise is violated only when its condition is met but its result fails — not when the result happens for other reasons." },
      { topicSlug: "propositional-logic-truth-tables", prompt: "You believe 'If the bridge were unsafe, the inspectors would have closed it.' The bridge is still open, so a neighbor concludes it's definitely safe. Is that conclusion as solid as it sounds? Walk through what it depends on.", correctAnswer: "The inference (open, therefore not unsafe) is valid ONLY if the premise is fully true — that inspectors would always catch and close an unsafe bridge. If inspectors can miss problems or be slow, the premise fails and 'still open' no longer guarantees 'safe.' So the conclusion is only as solid as that assumption about the inspectors, which is worth questioning.", explanation: "A valid conditional inference is only as trustworthy as the truth of the conditional it relies on." },
    ],
  },
  {
    kind: "midterm",
    title: "Midterm — Weeks 1 & 2",
    weekNumber: 2,
    isTimed: true,
    timeLimitMinutes: 60,
    instructions: "Cumulative midterm. 60 minutes. Pasting disabled.",
    problems: [
      { topicSlug: "arguments-vs-nonarguments", prompt: "'The room was cold and dark, and I felt uneasy.' A classmate insists this is an argument that the room was dangerous. Are they right? Explain what the passage actually does.", correctAnswer: "No — it only describes the room and a feeling; no reason is offered to support any conclusion, least of all 'the room was dangerous.' Reading danger into it adds a claim the passage never argues for. A description plus a feeling isn't an argument.", explanation: "Treating a description as an argument means importing a conclusion the passage never actually supports." },
      { topicSlug: "premises-and-conclusions", prompt: "'We should leave now, because the storm is coming.' Suppose the storm is actually a hundred miles away and moving off. Does the argument's logic become bad, or do you reject it for a different reason? Explain the difference.", correctAnswer: "The logic is fine — IF a storm were coming, leaving now would be reasonable. What fails is the premise: the storm isn't actually coming, so the support is false. You reject the conclusion not because the reasoning is invalid but because it rests on an untrue premise — and telling those two flaws apart matters.", explanation: "A bad inference and a false premise are different defects; diagnosing which one applies is part of evaluating an argument." },
      { topicSlug: "deductive-vs-inductive", prompt: "A weather app says there's a 90% chance of rain and the day stays dry. Did the forecast turn out false, or is something else going on? Explain how to judge a probabilistic claim like this.", correctAnswer: "A single dry day doesn't prove a 90% forecast false — 90% means rain is very likely, not certain, so about 1 in 10 such days staying dry is exactly what's expected. You judge probabilistic claims over many cases: only if it's dry far more than 10% of the days it calls '90%' are the forecasts actually miscalibrated. One outcome can't refute a probability.", explanation: "A probabilistic claim is tested against many outcomes, not refuted by any single one." },
      { topicSlug: "validity-and-soundness", prompt: "'If she trained, she'd be fit. She is fit. So she trained.' Your gym buddy is convinced. Give a concrete alternative story that makes the premises true but the conclusion false — and say what that proves about the argument.", correctAnswer: "She could be naturally fit, or fit from sports or physical work without ever 'training' — the premises hold (training would make her fit; she is fit) yet the conclusion is false (she never trained). That one consistent counterexample proves the argument is invalid: being fit has other explanations, so fitness doesn't establish training.", explanation: "A single case with true premises and a false conclusion proves an argument form invalid." },
      { topicSlug: "categorical-logic-syllogism", prompt: "'All cats are animals. All dogs are animals. So all dogs are cats.' The conclusion is obviously false. Explain WHY the reasoning fails, then build a different argument in the exact same pattern that makes the flaw unmistakable.", correctAnswer: "It fails because sharing a category ('animals') doesn't make two groups the same group. Same pattern: 'All spoons are utensils. All forks are utensils. So all forks are spoons.' — true premises, absurd conclusion. The form lets unrelated groups get equated through a shared category, so it's invalid no matter what words you plug in.", explanation: "Showing a parallel argument with the same form but an absurd conclusion exposes why the form itself is invalid." },
      { topicSlug: "propositional-logic-truth-tables", prompt: "You accept 'If the bill passes, taxes rise.' Later you learn taxes rose, and a pundit concludes the bill must have passed. Is that a safe inference? Explain.", correctAnswer: "No — the conditional only says passing the bill leads to higher taxes; taxes could rise for other reasons (a different law, inflation, local levies). From 'taxes rose' you can't conclude the bill passed. The only safe inferences are: if the bill passed, taxes rose — or, if taxes did NOT rise, the bill did not pass.", explanation: "From a conditional, you can run it forward from the condition or backward from the denied result — but not backward from the result." },
      { topicSlug: "inductive-strength-generalization", prompt: "A blogger eats two dishes at a huge restaurant, dislikes both, and declares it 'terrible at everything.' Rewrite her conclusion so it's actually justified by what she observed, and explain why your version holds up while hers doesn't.", correctAnswer: "Justified version: 'The two dishes I tried were disappointing.' That stays within what she actually observed. Her sweeping 'terrible at everything' generalizes from 2 of many menu items — far too small and possibly unrepresentative a sample to support a claim about the whole restaurant. A conclusion is defensible only when the evidence is broad enough to back it.", explanation: "A defensible generalization claims no more than its sample can actually support." },
      { topicSlug: "analogical-reasoning", prompt: "A senator argues: 'Running a country is just like running a household budget — when money's tight, you cut spending.' Identify the most important way a national economy might NOT be like a household, and explain how that difference could break the argument.", correctAnswer: "A key difference: unlike a household, a government's spending cuts can shrink the very economy (and tax revenue) it depends on, and it can borrow in its own currency on terms no household has. If those differences are relevant — and they are to fiscal policy — the household analogy breaks down, so 'cut spending when tight' doesn't automatically transfer. Analogies hold only where the cases are alike in the relevant respects.", explanation: "An analogy is only as strong as the relevant similarities; a relevant disanalogy can break it." },
    ],
  },

  // Week 3
  {
    kind: "homework",
    title: "Homework 3.1 — Fallacies",
    weekNumber: 3,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "fallacies-of-relevance", prompt: "In a debate, Sam replies to Maria's budget argument: 'You can't trust her — she failed math in high school,' and her opponents cheer. Explain why Sam's reply leaves Maria's actual argument completely standing — and what Sam would have had to do to actually refute it.", correctAnswer: "Sam attacked Maria, not her argument — even if she failed math, her budget reasoning could be entirely correct, so her conclusion is untouched. Whether a claim is true doesn't depend on who makes it. To refute her, Sam would have to engage the argument itself: show one of her premises is false or that her conclusion doesn't follow from them.", explanation: "An attack on the person leaves the argument intact; only engaging the reasoning can refute it." },
      { topicSlug: "fallacies-weak-induction", prompt: "Your uncle insists his lucky socks win games: 'Every time I wear them, my team wins.' Design the simplest test that could actually tell whether the socks do anything — and explain what result would convince you he's wrong.", correctAnswer: "Compare how often the team wins WITH the socks versus WITHOUT them across many games. If the team wins at about the same rate either way, the socks make no difference and the past 'wins' were just coincidence. His evidence only counts the games with the socks and never looks at the comparison case, which is what you need to tell sequence from cause.", explanation: "Establishing cause requires comparing outcomes with and without the suspected factor, not just noting it preceded the result." },
      { topicSlug: "fallacies-presumption-ambiguity", prompt: "A reporter asks a CEO, 'Have you stopped overcharging your customers?' and he's about to answer yes. Explain the trap, and tell the CEO exactly how to respond so he doesn't concede something false.", correctAnswer: "Both 'yes' and 'no' accept the buried assumption that he WAS overcharging — the question smuggles in an unproven claim. He shouldn't answer it on its terms; he should reject the premise first ('I dispute the premise — we never overcharged') and then address pricing on his own terms. Answering a loaded question directly concedes the very thing in dispute.", explanation: "A loaded question hides an unproven assumption; the move is to reject the premise rather than answer within it." },
    ],
  },
  {
    kind: "homework",
    title: "Homework 3.2 — Bias, language, and sources",
    weekNumber: 3,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "rhetoric-persuasion-spin", prompt: "Two headlines describe the identical event: 'Citizens rise up for their rights' vs. 'Mob disrupts city streets.' Strip each down to what actually happened, and explain how the wording was steering you before you saw any facts.", correctAnswer: "A neutral version is just: 'A group gathered in the streets to protest.' 'Citizens rise up for their rights' frames them as heroic and justified; 'mob disrupts' frames them as a destructive threat — both inject a verdict through word choice, not evidence. Loaded wording pushes you toward a judgment before any facts about who, why, or what happened are established.", explanation: "Neutralizing loaded language exposes how much of a 'report' is a verdict smuggled in through word choice." },
      { topicSlug: "cognitive-biases-motivated-reasoning", prompt: "A man sure his stock will rise reads only bullish articles and skips the warnings, saying, 'See? Everything I read confirms I'm right.' Explain why the agreement of his sources is not actually evidence he's right — and what he'd have to do to honestly test his belief.", correctAnswer: "His sources agree only because he selected ones that agree — he filtered out the disconfirming evidence, so the 'confirmation' is manufactured by his search, not by reality. To honestly test the belief he'd have to actively seek the strongest bearish case and see whether his view survives it. Evidence only counts if you'd have accepted it had it pointed the other way.", explanation: "Confirmation you got by only looking for agreement is no evidence at all; an honest test seeks the disconfirming case." },
      { topicSlug: "language-definition-vagueness", prompt: "Two coworkers argue for an hour over whether their startup is 'successful' — one points to fast revenue growth, the other to the fact that it's still losing money. Are they actually disagreeing about the facts, or about something else? Show how to dissolve the argument.", correctAnswer: "They likely agree on the facts (revenue is growing AND it's losing money) and are really disagreeing over what 'successful' means — growth versus profitability. It's largely a verbal dispute. To dissolve it, pin down the definition: agree on which measure of 'success' they mean, and the factual disagreement either vanishes or turns into a real, answerable question.", explanation: "Many 'disagreements' are verbal; defining the contested word reveals whether any real dispute remains." },
      { topicSlug: "credibility-sources-testimony", prompt: "A supplement website looks slick, cites 'Dr. Smith,' and boasts '10,000 happy customers,' and a friend says all that makes it trustworthy. Walk through why none of those three things shows the supplement works — and say what would actually count as good evidence.", correctAnswer: "A slick site is just design (easy to fake); 'Dr. Smith' means nothing without knowing whether she's a real, relevant, independent expert; and '10,000 happy customers' are testimonials that don't rule out placebo or coincidence. What would actually count is independent, controlled studies showing the supplement outperforms a placebo — checked against sources that aren't selling it.", explanation: "Polish, a name, and testimonials aren't evidence of effectiveness; controlled, independent results are." },
    ],
  },
  {
    kind: "test",
    title: "Week 3 Test",
    weekNumber: 3,
    isTimed: true,
    timeLimitMinutes: 40,
    instructions: "Timed. 40 minutes. Pasting disabled.",
    problems: [
      { topicSlug: "fallacies-of-relevance", prompt: "Ari proposes easing the campus curfew by one hour. Dana replies, 'Ari wants total lawlessness with no rules at all.' Explain precisely how Dana's response misrepresents Ari, and what a fair reply to Ari's ACTUAL proposal would need to address.", correctAnswer: "Dana inflates a one-hour change into 'total lawlessness,' attacking a position Ari never took — so even if 'no rules' would be bad, that says nothing about his modest proposal. A fair reply has to engage the actual one-hour extension: for instance, give evidence that this specific change would cause real harm, rather than knocking down an extreme caricature.", explanation: "Refuting an exaggerated version of a claim leaves the real, narrower claim completely unanswered." },
      { topicSlug: "fallacies-weak-induction", prompt: "Someone argues: 'If we let students retake one test, soon they'll retake everything and grades will be meaningless.' Identify the weakest link in this chain of predictions and explain what evidence would be needed to take the worry seriously.", correctAnswer: "The weakest link is the jump from 'retake one test' to 'retake everything' — nothing shows one limited allowance forces unlimited retakes; a rule can permit one and stop there. To take the worry seriously you'd need actual evidence that limited retake policies in real schools snowballed into no standards. Without support for each step, the catastrophe is just asserted.", explanation: "A chain-of-doom prediction is only as strong as its weakest link; each step needs its own evidence." },
      { topicSlug: "fallacies-presumption-ambiguity", prompt: "A company says, 'Our product is the most trusted because more people trust it than any other,' and a customer finds this convincing. Explain why this gives her literally no reason to trust the product.", correctAnswer: "'Most trusted' and 'more people trust it than any other' say the same thing, so the reason just restates the conclusion — it assumes what it's supposed to show and adds no independent evidence. To actually justify trust you'd need something outside the claim itself, like a safety record or independent reviews. Circular support never leaves its starting point, so it proves nothing.", explanation: "When the reason just restates the conclusion, no independent support has been given." },
      { topicSlug: "cognitive-biases-motivated-reasoning", prompt: "A shopper sees a jacket marked 'was $400, now $150,' feels it's a steal, and buys instantly without ever checking what such jackets actually cost. Explain how the '$400' did its work — and how she could have protected her judgment.", correctAnswer: "The $400 anchored her: $150 feels cheap only by comparison to it, regardless of the jacket's real worth — and the 'was' price may be inflated or fictional precisely to create that contrast. She could protect her judgment by ignoring the seller's reference price and checking what comparable jackets sell for elsewhere, judging $150 on its own merits.", explanation: "An anchor distorts judgment by comparison; defusing it means valuing the thing against independent information." },
      { topicSlug: "credibility-sources-testimony", prompt: "Faced with an official-looking site she's never heard of, a fact-checker opens new tabs to see what independent sources say about it instead of carefully studying the site itself. Explain why leaving the site is smarter than reading its 'About' page.", correctAnswer: "A site's own 'About' page and polished design are exactly what a deceptive site controls, so studying them only tells you what it wants you to think, not whether it's reliable. Checking independent sources reveals reputation and corroboration the site can't manufacture. Credibility is judged from outside evidence, not the source's self-description.", explanation: "You assess a source's trustworthiness from independent evidence, not from the self-presentation it fully controls." },
    ],
  },

  // Week 4
  {
    kind: "homework",
    title: "Homework 4.1 — Probability, evidence, decisions",
    weekNumber: 4,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "probability-statistical-reasoning", prompt: "A disease affects 1 in 10,000 people. A test for it is '99% accurate.' Your friend tests positive and panics, certain she has it. Reason through the numbers to show why she's probably fine anyway.", correctAnswer: "Picture 10,000 people: about 1 truly has the disease, while the test wrongly flags roughly 1% of the 9,999 healthy people — about 100 false positives. So out of ~101 positive results, only ~1 is real: a positive means roughly a 1% chance of actually having it. Because the disease is so rare, almost all positives are false alarms, so panic isn't warranted before further testing.", explanation: "When a condition is rare, even a highly accurate test produces mostly false positives — the base rate dominates." },
      { topicSlug: "evaluating-evidence-science", prompt: "A friend claims an invisible dragon lives in his garage. You offer to feel its heat — he says it's heatless. You offer to spread flour for footprints — it floats. Every test you propose, he explains away in advance. At what point, and why, should you conclude there's nothing to the claim?", correctAnswer: "Once every possible test is pre-emptively explained away, the claim predicts nothing — there is no observation that could ever count against it, so it's indistinguishable from there being no dragon at all. A claim immune to all evidence isn't merely 'unproven,' it's empty: with no way to test it, there's no reason to believe it.", explanation: "A claim that's been rigged so no observation could ever disconfirm it gives you no reason to believe it." },
      { topicSlug: "decision-making-uncertainty", prompt: "Lottery A: a 1% chance to win $1,000. Lottery B: a 50% chance to win $30. Tickets cost the same $5. Which is the better bet on average — and would your answer change if you could play only once and desperately needed $1,000 tonight? Explain.", correctAnswer: "On average B is better: 0.5×$30 = $15 versus A's 0.01×$1,000 = $10 (both beat the $5 cost, but B returns more per play). However, if you play once and specifically need $1,000, B can never deliver it — only A can — so despite its lower average it becomes the rational pick. Which is the 'better bet' depends on whether you're maximizing average return or hitting a specific threshold.", explanation: "Expected value ranks options on average, but your actual goal can make a lower-EV option the rational choice." },
    ],
  },
  {
    kind: "homework",
    title: "Homework 4.2 — Values, writing, and misinformation",
    weekNumber: 4,
    isTimed: false,
    timeLimitMinutes: null,
    instructions: "Untimed practice.",
    problems: [
      { topicSlug: "moral-value-reasoning", prompt: "Someone argues: 'Studies show prisons don't reduce crime, so we should spend less on them.' Even granting the study is right, spell out the hidden value step this argument needs — and explain how someone could accept the facts but still reject the conclusion.", correctAnswer: "The fact ('prisons don't reduce crime') is descriptive; 'we should spend less' is a value claim, and bridging them needs a hidden premise like 'we should fund prisons only insofar as they reduce crime.' Someone could accept the study but reject the conclusion by holding a different value — e.g. that prisons also serve justice or public safety apart from deterrence. You can't get an 'ought' from an 'is' without a value premise.", explanation: "Moving from facts to what we should do always smuggles in a value premise that can itself be disputed." },
      { topicSlug: "reasoning-in-writing", prompt: "A student's essay lists ten true facts about climate change, but readers can't tell what she's arguing. Her friend says, 'Just add more facts.' Explain why more facts won't fix it, and what actually will.", correctAnswer: "More facts won't help because the problem isn't a shortage of information — it's the absence of a single central claim the facts are organized to support. Without a thesis, facts are just a pile. The fix is to decide what point she's arguing for, then arrange the facts as reasons for that point and cut whatever doesn't support it.", explanation: "Persuasive writing needs a central claim that organizes the evidence; more evidence can't substitute for a thesis." },
      { topicSlug: "detecting-misinformation", prompt: "Two people share the same false health claim: one genuinely believed it and wanted to help; the other knew it was false and posted it to sell a product. A bystander says, 'False is false — they're equally bad.' Do you agree? Reason it out.", correctAnswer: "No — both spread something false, but the second acted with intent to deceive for gain while the first made an honest mistake trying to help. Intent and motive matter for blame: the deliberate deceiver is more culpable even though the false content is identical. Judging only the output and ignoring intent misses what makes one case worse.", explanation: "Identical false content can carry different culpability because intent to deceive is itself part of the wrong." },
      { topicSlug: "critical-thinking-across-domains", prompt: "A student who's great at spotting weak arguments in history class shares a shocking political meme without a second thought. What exactly is she failing to do — and what would applying her history-class skills to the meme look like, step by step?", correctAnswer: "She's failing to transfer her reasoning skills out of the classroom into the everyday media she actually encounters. Applied to the meme, it would look like: ask what's actually being claimed, check the source and whether it's reliable, look for missing context or cherry-picked numbers, and verify with independent sources before sharing. The skills only pay off when deliberately carried into new contexts.", explanation: "Reasoning skills don't transfer automatically; their value depends on consciously applying them in new contexts." },
    ],
  },
  {
    kind: "final",
    title: "Final Exam — All weeks",
    weekNumber: 4,
    isTimed: true,
    timeLimitMinutes: 90,
    instructions: "Cumulative final. 90 minutes. Pasting disabled.",
    problems: [
      { topicSlug: "arguments-vs-nonarguments", prompt: "'We should leave now, because the storm is coming.' versus 'We left because the storm was coming.' One is making a case; the other is explaining a past action. Which is which, and why does the difference change how you'd respond to each?", correctAnswer: "The first argues for a conclusion (we should leave), offering the storm as a reason to act — you'd respond by assessing whether that reason justifies leaving. The second explains why an already-completed leaving happened — you'd respond by asking whether that's the real cause. One invites you to evaluate support for a decision; the other, the accuracy of an explanation.", explanation: "Telling an argument from an explanation determines whether you should test the support or the proposed cause." },
      { topicSlug: "premises-and-conclusions", prompt: "'Since the new manager arrived, sales doubled — clearly she's a brilliant leader.' Lay out the reasoning, then explain why the support might not actually establish the conclusion.", correctAnswer: "Support: sales doubled since she arrived; conclusion: she's a brilliant leader. The support doesn't establish it — sales could have doubled for reasons unrelated to her: a market boom, a new product, seasonality, a competitor failing. 'After she arrived' isn't 'because of her'; to credit her you'd have to rule out those other causes.", explanation: "A conclusion drawn from 'it happened after X' fails until the rival causes are ruled out." },
      { topicSlug: "validity-and-soundness", prompt: "'All successful people wake up at 5am. I wake up at 5am. So I'll be successful.' Your friend is convinced. Find the problem — is it the logic, the premises, or both? Explain.", correctAnswer: "Both. The logic is faulty: even if successful people wake at 5am, that doesn't make every early riser successful — plenty of early risers aren't, so the conclusion doesn't follow. And the premise 'all successful people wake at 5am' is simply false. The conclusion is unsupported on two separate counts.", explanation: "An argument can fail through invalid form, false premises, or both — a thorough check looks for each." },
      { topicSlug: "deductive-vs-inductive", prompt: "A pollster surveys a representative sample and projects the election winner. A geometry teacher proves the angles of a triangle sum to 180°. One conclusion is guaranteed by its reasons; the other is only made likely. Which is which, and what could make the 'likely' one wrong even if it's done perfectly?", correctAnswer: "The geometry proof is guaranteed — given the axioms, the conclusion can't be false. The poll is only probable: even a perfect representative sample can miss because people change their minds, turnout differs, or sampling luck runs against you. Generalizing from a sample to a whole population is inductive, so even a well-run poll can be wrong.", explanation: "Deductive proof guarantees its conclusion; inductive generalization stays fallible even when done correctly." },
      { topicSlug: "propositional-logic-truth-tables", prompt: "'If it's a dog, then it's an animal. Rex is not a dog. So Rex is not an animal.' A child finds this convincing. Show it's wrong with a concrete example, then explain the general mistake.", correctAnswer: "Counterexample: Rex could be a cat — not a dog, but still an animal — so the premises hold and the conclusion fails. The mistake is thinking that denying the 'if' part lets you deny the 'then' part; but being an animal has routes other than being a dog, so ruling out dog doesn't rule out animal.", explanation: "Denying a conditional's condition doesn't deny its result, since the result can hold by other routes." },
      { topicSlug: "fallacies-of-relevance", prompt: "A senator dismisses a climate study with 'It was funded by people I dislike,' never addressing the data. Explain why the funding source alone can't show the data is wrong — and the one situation where knowing the funder IS legitimately relevant.", correctAnswer: "Who funded a study doesn't determine whether its data and methods are sound — the results stand or fall on the evidence, so attacking the funder dodges the argument. Funding is legitimately relevant only as a reason to SCRUTINIZE for bias (check the methods, look for conflicts of interest), not as proof the conclusion is false. Suspicion warrants a closer look, not automatic rejection.", explanation: "A source's funding can justify extra scrutiny but never by itself proves the argument's conclusion false." },
      { topicSlug: "fallacies-weak-induction", prompt: "'I took the supplement and my cold went away in a week, so it cured me.' Explain why this doesn't show the supplement worked, and describe what evidence would.", correctAnswer: "Colds resolve on their own in about a week, so recovery after the supplement could simply be the cold running its normal course — recovery following the supplement isn't proof it caused recovery. Real evidence would compare many people who took it against similar people who didn't (ideally with a placebo): only if the supplement group recovers faster does it show an effect.", explanation: "Recovery after a remedy isn't evidence it worked unless compared against what happens without it." },
      { topicSlug: "cognitive-biases-motivated-reasoning", prompt: "An investor reads only the news predicting his stock will rise, dismissing every warning as 'written by pessimists.' Explain the self-sealing trap he's in and what an honest review of his position would require.", correctAnswer: "He's arranged his reasoning so nothing can change his mind: supporting news is accepted, contrary news is dismissed by attacking its source — so he only ever 'confirms' his view. That's filtering, not evidence. An honest review requires seeking out the strongest case AGAINST the stock and judging it on its merits, including asking what evidence would make him sell.", explanation: "Reasoning that dismisses all disconfirming evidence can never be tested; honesty means letting the contrary case count." },
      { topicSlug: "probability-statistical-reasoning", prompt: "Bet A: a 10% chance to win $100. Bet B: a 90% chance to win $15. Same cost. Compute which is better on average — then describe a real situation where a rational person would still pick the worse-on-average bet.", correctAnswer: "On average B wins: 0.9×$15 = $13.50 versus A's 0.1×$100 = $10. But a rational person might still pick A if they specifically need close to $100 and $15 is useless for their goal — then the small shot at $100 is worth more to them than a near-certain $15. Expected value ranks them on average; a specific goal can justify a different choice.", explanation: "Expected value identifies the better average bet, but a threshold goal can rationally override it." },
      { topicSlug: "capstone-synthesis", prompt: "A viral post claims: 'A new study PROVES coffee prevents cancer — share to spread the word!' Using everything you've learned, lay out the specific checks you'd run before believing and resharing this, and what could make you reject the strong claim even if a real study exists.", correctAnswer: "Find the actual study behind the post, not just the post; check whether it really shows causation or only a correlation; look at the sample size, who funded it, and whether other studies agree; and watch the leap from 'linked to' to 'prevents.' Even with a real study, reject the strong claim if it's a single small or industry-funded study, if it only shows correlation, or if the post exaggerates the findings. Believe it only when true, solid premises actually support that specific conclusion.", explanation: "A trustworthy conclusion needs true, well-sourced premises that genuinely support the specific claim — verified before sharing." },
    ],
  },
];

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.execute(sql`select count(*)::int as n from topics`);
  const row = (existing.rows[0] ?? {}) as { n?: number };
  if ((row.n ?? 0) > 0) {
    logger.info("Seed: already populated, skipping");
    return;
  }
  logger.info("Seed: populating course content");

  // Topics + lectures
  const slugToTopicId = new Map<string, number>();
  for (let i = 0; i < TOPICS.length; i++) {
    const t = TOPICS[i]!;
    const [inserted] = await db
      .insert(topicsTable)
      .values({
        slug: t.slug,
        title: t.title,
        weekNumber: t.weekNumber,
        blurb: t.blurb,
        position: i,
      })
      .returning();
    if (!inserted) throw new Error(`Failed to insert topic ${t.slug}`);
    slugToTopicId.set(t.slug, inserted.id);
    await db.insert(lecturesTable).values({
      topicId: inserted.id,
      weekNumber: t.weekNumber,
      title: t.lectureTitle,
      body: t.body,
    });
  }

  // Assignments + problems
  for (let i = 0; i < ASSIGNMENTS.length; i++) {
    const a = ASSIGNMENTS[i]!;
    const [inserted] = await db
      .insert(assignmentsTable)
      .values({
        kind: a.kind,
        title: a.title,
        weekNumber: a.weekNumber,
        position: i,
        isTimed: a.isTimed,
        timeLimitMinutes: a.timeLimitMinutes,
        instructions: a.instructions,
      })
      .returning();
    if (!inserted) throw new Error(`Failed to insert assignment ${a.title}`);
    for (let p = 0; p < a.problems.length; p++) {
      const prob = a.problems[p]!;
      const topicId = slugToTopicId.get(prob.topicSlug);
      if (!topicId) throw new Error(`Unknown topic slug ${prob.topicSlug}`);
      await db.insert(problemsTable).values({
        assignmentId: inserted.id,
        topicId,
        position: p,
        prompt: prob.prompt,
        correctAnswer: prob.correctAnswer,
        explanation: prob.explanation,
        hint: prob.hint ?? null,
      });
    }
  }

  logger.info({ topics: TOPICS.length, assignments: ASSIGNMENTS.length }, "Seed complete");
}

// Idempotently bring the already-seeded database in line with the current
// ASSIGNMENTS definitions. Existing rows are UPDATED in place (matched by
// assignment title + problem position) so we never wipe a student's attempts,
// answers, or sessions. Safe to run on every boot.
export async function syncCourseContent(): Promise<void> {
  let updated = 0;
  for (const a of ASSIGNMENTS) {
    const [assignment] = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.title, a.title));
    if (!assignment) continue;
    for (let p = 0; p < a.problems.length; p++) {
      const prob = a.problems[p]!;
      const res = await db
        .update(problemsTable)
        .set({
          prompt: prob.prompt,
          correctAnswer: prob.correctAnswer,
          explanation: prob.explanation,
        })
        .where(
          and(
            eq(problemsTable.assignmentId, assignment.id),
            eq(problemsTable.position, p),
          ),
        )
        .returning({ id: problemsTable.id });
      updated += res.length;
    }
  }
  // Sync lecture bodies too. Only touch a lecture when its source body actually
  // changed; when it does, invalidate the cached depth rewrites and starter
  // questions so they regenerate from the new content (otherwise they are left
  // untouched, so restarts don't churn or wipe student-triggered expansions).
  let lecturesUpdated = 0;
  for (const t of TOPICS) {
    const [topic] = await db
      .select()
      .from(topicsTable)
      .where(eq(topicsTable.slug, t.slug));
    if (!topic) continue;
    const [lecture] = await db
      .select()
      .from(lecturesTable)
      .where(eq(lecturesTable.topicId, topic.id));
    if (!lecture) continue;
    if (lecture.body === t.body && lecture.title === t.lectureTitle) continue;
    await db
      .update(lecturesTable)
      .set({
        title: t.lectureTitle,
        body: t.body,
        bodyMedium: null,
        bodyLong: null,
        starterQuestions: null,
      })
      .where(eq(lecturesTable.id, lecture.id));
    lecturesUpdated += 1;
  }

  logger.info({ updated, lecturesUpdated }, "Course content sync complete");
}
