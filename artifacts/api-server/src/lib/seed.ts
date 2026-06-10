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
      { topicSlug: "what-is-critical-thinking", prompt: "A friend says, 'Critical thinking just means shooting down whatever other people say.' Is that a fair description of what critical thinking is, and what does it actually involve?", correctAnswer: "No. Critical thinking is fairly weighing reasoning and evidence to judge what's true — not just attacking or rejecting other people's views.", explanation: "Critical thinking is fair evaluation of reasoning, not mere fault-finding." },
      { topicSlug: "claims-beliefs-truth", prompt: "Two sentences: (a) 'Please shut the window.' (b) 'The window is shut.' Which one could turn out to be true or false, and why?", correctAnswer: "Sentence (b) — it describes how the world is, so it can be checked as true or false; (a) is a request, so it has no truth value.", explanation: "Only statements that assert something about the world can be true or false; requests and commands cannot." },
      { topicSlug: "arguments-vs-nonarguments", prompt: "'You should exercise because it lowers your risk of heart disease.' Is the speaker just stating an opinion, or giving a reason to support a conclusion? Explain.", correctAnswer: "Giving a reason to support a conclusion — 'because it lowers your risk' is offered as support for the claim that you should exercise.", explanation: "When a reason is offered for a conclusion, the passage is an argument rather than a bare assertion." },
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
      { topicSlug: "premises-and-conclusions", prompt: "In 'All dogs are mammals, so Rex is a mammal,' which part is the point the speaker is trying to establish, and which part is the support offered for it?", correctAnswer: "The point being established is that Rex is a mammal; the support is that all dogs are mammals.", explanation: "The conclusion is what's argued for; the premise is the reason given for it." },
      { topicSlug: "identifying-reconstructing-arguments", prompt: "Someone argues, 'Rex is a dog, so Rex is a mammal.' The argument leaves out one assumption it depends on. What unstated assumption is needed for it to work?", correctAnswer: "That all dogs are mammals — without that assumption, being a dog wouldn't get you to being a mammal.", explanation: "Arguments often rely on an unstated assumption that must be true for the reasoning to hold." },
      { topicSlug: "diagramming-arguments", prompt: "An argument runs: 'This medicine is safe because it passed trials AND those trials were large and independent.' If you drop the part about the trials being large and independent, does 'it passed trials' still support the conclusion just as well? Explain.", correctAnswer: "No — the two reasons work together; on its own, 'it passed trials' is much weaker support, so removing one badly undercuts the case.", explanation: "When reasons depend on each other to support a conclusion, weakening one weakens the whole support." },
      { topicSlug: "standardizing-charity", prompt: "Before criticizing an argument you disagree with, why is it wiser to first restate it in its strongest, most reasonable form?", correctAnswer: "So you respond to what the person actually means at its best, instead of knocking down a weak misrepresentation that proves nothing.", explanation: "Engaging the strongest version of a view avoids attacking a distortion of it." },
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
      { topicSlug: "claims-beliefs-truth", prompt: "'Close the door.' Could this sentence be true or false? Answer yes or no and explain why.", correctAnswer: "No — it is a command, so it doesn't assert anything that could be true or false.", explanation: "Only assertions about how things are can have a truth value; commands cannot." },
      { topicSlug: "arguments-vs-nonarguments", prompt: "Everyone already agrees the bridge collapsed. A report says, 'The bridge collapsed because its steel had corroded.' Is the report trying to PROVE that the bridge collapsed, or to say WHY it collapsed? Explain.", correctAnswer: "It's saying why it collapsed (an explanation), not proving that it collapsed — since both sides already accept that it did.", explanation: "An explanation gives the cause of an accepted fact; an argument tries to establish a disputed claim." },
      { topicSlug: "premises-and-conclusions", prompt: "In 'The streets are wet, so it rained,' what is the speaker concluding, and what evidence are they using to get there?", correctAnswer: "They conclude that it rained, using the wet streets as the evidence for it.", explanation: "The conclusion is the claim reached; the premise is the observation used to support it." },
      { topicSlug: "premises-and-conclusions", prompt: "You read: 'She studied all month; therefore she passed.' Which statement is the support and which is the conclusion drawn from it?", correctAnswer: "Support: she studied all month. Conclusion: she passed.", explanation: "The word 'therefore' marks what follows as the conclusion." },
      { topicSlug: "diagramming-arguments", prompt: "An argument says: 'We should hire her — she has ten years' experience, she interviewed well, and her references are excellent.' If just one of those three reasons turned out to be false, would the whole argument collapse? Explain.", correctAnswer: "No — each reason supports the hiring conclusion on its own, so losing one weakens the case but doesn't destroy it.", explanation: "When several reasons each support a conclusion independently, removing one doesn't break the others." },
      { topicSlug: "what-is-critical-thinking", prompt: "After finishing a hard problem, a student pauses and asks, 'Where might my own reasoning have gone wrong here?' Why is deliberately checking your own thinking like this valuable?", correctAnswer: "It catches your own mistakes and biases before they mislead you, making your conclusions more reliable.", explanation: "Monitoring and questioning your own reasoning improves its accuracy." },
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
      { topicSlug: "deductive-vs-inductive", prompt: "An argument is built so that if its premises are true, the conclusion CANNOT be false. Does this argument aim to make its conclusion merely likely, or fully guaranteed? Explain.", correctAnswer: "Fully guaranteed — it's built so the conclusion must be true whenever the premises are.", explanation: "Reasoning that aims for a guaranteed conclusion is deductive." },
      { topicSlug: "deductive-vs-inductive", prompt: "'Every swan I have seen is white, so all swans are white.' Does that conclusion follow with certainty, or is it only made probable by the evidence? Explain.", correctAnswer: "Only probable — it generalizes from limited observations, so a single non-white swan could overturn it.", explanation: "Generalizing from observed cases to all cases is inductive and not certain." },
      { topicSlug: "validity-and-soundness", prompt: "An argument's logic is airtight AND all of its premises are actually true. What can you conclude about its conclusion, and why?", correctAnswer: "The conclusion must be true — valid logic plus all-true premises guarantees a true conclusion.", explanation: "Validity preserves truth, so true premises forced through valid logic yield a true conclusion." },
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
      { topicSlug: "validity-and-soundness", prompt: "Can an argument have flawless logic and still end up with a false conclusion? Answer yes or no and explain how that's possible.", correctAnswer: "Yes — if one of its premises is false. Flawless logic only guarantees a true conclusion when the premises are also all true.", explanation: "Valid form preserves truth, but feed it a false premise and the conclusion can be false." },
      { topicSlug: "categorical-logic-syllogism", prompt: "'All A are B. All B are C. Therefore all A are C.' Whenever the two premises are true, does the conclusion HAVE to be true? Explain.", correctAnswer: "Yes — the conclusion necessarily follows; there's no way for the premises to be true and the conclusion false.", explanation: "The chain through the shared middle term forces the conclusion." },
      { topicSlug: "propositional-logic-truth-tables", prompt: "Consider the promise 'If it rains, the game is cancelled.' In exactly what situation would this promise turn out to have been broken?", correctAnswer: "Only when it rains but the game is NOT cancelled — the condition happens yet the promised result fails.", explanation: "A conditional is broken only when its 'if' part holds but its 'then' part doesn't." },
      { topicSlug: "propositional-logic-truth-tables", prompt: "You accept 'If the alarm works, it will sound.' The alarm did NOT sound. What can you validly conclude, and why?", correctAnswer: "That the alarm does not work — if it did, it would have sounded, but it didn't.", explanation: "Denying the result of a true conditional lets you deny its condition." },
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
      { topicSlug: "arguments-vs-nonarguments", prompt: "'The room was cold and dark.' Is anything being argued for here, or is this just a description? Explain.", correctAnswer: "Just a description — no reason is offered to support any conclusion, so it isn't an argument.", explanation: "Without a reason supporting a claim, a passage is not an argument." },
      { topicSlug: "premises-and-conclusions", prompt: "In 'We should leave now, because the storm is coming,' which word signals that a reason is being given, and what is that reason?", correctAnswer: "'Because' signals the reason — namely that the storm is coming.", explanation: "Words like 'because' flag the premise that supports the conclusion." },
      { topicSlug: "deductive-vs-inductive", prompt: "An argument's premises are meant to make its conclusion likely but not guaranteed. Does its conclusion follow with certainty? Explain.", correctAnswer: "No — the support is a matter of degree, so the conclusion is only probable, not certain.", explanation: "When support is probabilistic rather than necessary, the reasoning is inductive." },
      { topicSlug: "validity-and-soundness", prompt: "'If she trained, she'd be fit. She is fit. So she trained.' Does that conclusion really follow from the premises? Explain.", correctAnswer: "No — she could be fit for other reasons, so concluding she trained isn't justified.", explanation: "Affirming the result doesn't establish the cause; the conclusion can be false even if the premises are true." },
      { topicSlug: "categorical-logic-syllogism", prompt: "'All cats are animals. All dogs are animals. Therefore all dogs are cats.' The premises are true but the conclusion is false. What does that tell you about this reasoning?", correctAnswer: "The reasoning is broken — true premises leading to a false conclusion show the form is invalid.", explanation: "If true premises can yield a false conclusion, the argument form is invalid." },
      { topicSlug: "propositional-logic-truth-tables", prompt: "You accept 'If the bill passes, taxes rise.' The bill passes. What follows, and why?", correctAnswer: "Taxes rise — the condition was met, so the stated result must follow.", explanation: "When a true conditional's 'if' part holds, its 'then' part must hold too." },
      { topicSlug: "inductive-strength-generalization", prompt: "A blogger tries two dishes at a large restaurant, dislikes both, and declares 'This place is terrible at everything.' What is weak about this reasoning?", correctAnswer: "The sample is far too small — two dishes can't support a sweeping conclusion about the entire menu.", explanation: "Generalizing from an inadequate sample makes the conclusion unreliable." },
      { topicSlug: "analogical-reasoning", prompt: "Someone argues a new drug will work in humans because it worked in mice. What kind of similarity between mice and humans would make this analogy strong rather than weak?", correctAnswer: "Similarities relevant to how the drug actually acts — like comparable biology and metabolism — not superficial resemblances.", explanation: "Analogies are strong when the shared features are relevant to the conclusion." },
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
      { topicSlug: "fallacies-of-relevance", prompt: "In a debate, Sam replies to Maria's argument by saying, 'You can't trust her — she failed math in high school.' What's wrong with Sam's reply as a response to her argument?", correctAnswer: "It attacks Maria personally instead of engaging her argument, so it gives no real reason her conclusion is wrong.", explanation: "Attacking the person rather than the argument leaves the argument itself untouched." },
      { topicSlug: "fallacies-weak-induction", prompt: "'I wore my lucky socks and we won, so the socks caused the win.' Why is this reasoning weak?", correctAnswer: "It assumes that because the win came after wearing the socks, the socks caused it — but sequence alone isn't evidence of cause.", explanation: "One thing following another doesn't show the first caused the second." },
      { topicSlug: "fallacies-presumption-ambiguity", prompt: "A reporter asks a politician, 'Have you stopped wasting taxpayer money?' Why is this question unfair no matter how he answers yes or no?", correctAnswer: "It smuggles in the unproven assumption that he was wasting money — both 'yes' and 'no' concede that he was.", explanation: "A question that presupposes an unproven claim traps any direct answer into accepting it." },
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
      { topicSlug: "rhetoric-persuasion-spin", prompt: "One outlet calls a group 'freedom fighters' while another calls the very same group 'terrorists.' How do these word choices affect a reader before any evidence is presented?", correctAnswer: "They steer the reader's emotions and judgment through the wording itself, rather than supplying any evidence either way.", explanation: "Emotionally loaded wording pushes a verdict in place of giving reasons." },
      { topicSlug: "cognitive-biases-motivated-reasoning", prompt: "A man convinced a diet works reads only the glowing success stories and skips every study showing it has no effect. What's the flaw in how he's gathering evidence?", correctAnswer: "He only seeks evidence that confirms what he already believes and ignores evidence that could prove him wrong.", explanation: "Collecting only belief-consistent evidence produces a distorted, one-sided picture." },
      { topicSlug: "language-definition-vagueness", prompt: "Two people argue about whether to meet 'at the bank' — one means a riverbank, the other a financial bank. What about the word is causing their disagreement?", correctAnswer: "The word has two distinct meanings, so they're talking about different things — the dispute is verbal, not a real disagreement.", explanation: "When a word carries multiple meanings, a clash can be merely about words rather than substance." },
      { topicSlug: "credibility-sources-testimony", prompt: "An ad sells heart medication using a famous actor's endorsement. Why is that endorsement weak evidence that the medication actually works?", correctAnswer: "The actor isn't a relevant medical expert — celebrity status doesn't make a health claim true.", explanation: "An endorsement only carries weight when the source has genuine, relevant expertise." },
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
      { topicSlug: "fallacies-of-relevance", prompt: "Ari argues we should ease the campus curfew by an hour. Dana responds, 'Ari wants total lawlessness with no rules at all.' What did Dana do wrong?", correctAnswer: "Dana distorted Ari's modest proposal into an extreme version and attacked that instead of his actual position.", explanation: "Refuting an exaggerated misrepresentation leaves the real argument standing." },
      { topicSlug: "fallacies-weak-induction", prompt: "'If we let students retake one test, soon they'll demand to retake everything and grades will mean nothing.' Why is this reasoning weak?", correctAnswer: "It assumes an unsupported chain from one small step to disaster without showing each link is actually likely.", explanation: "Predicting catastrophe through unjustified intermediate steps is unsupported." },
      { topicSlug: "fallacies-presumption-ambiguity", prompt: "'The book is true because it says so, and what it says must be true because the book is reliable.' What's wrong with this reasoning?", correctAnswer: "It assumes the very thing it's trying to prove — the conclusion is already buried in the premises, so it proves nothing.", explanation: "Reasoning that takes its conclusion for granted as a premise establishes nothing." },
      { topicSlug: "cognitive-biases-motivated-reasoning", prompt: "A shopper sees a jacket marked 'was $400, now $150' and feels it's a steal — without ever checking what the jacket is actually worth. How is that first number distorting her judgment?", correctAnswer: "The $400 anchors her, so $150 feels cheap by comparison regardless of the jacket's real value.", explanation: "An initial figure skews later judgments even when it's arbitrary." },
      { topicSlug: "credibility-sources-testimony", prompt: "Unsure whether a slick-looking website is trustworthy, a fact-checker leaves the site and checks what independent sources say about it. Why is that smarter than judging the site by how polished it looks?", correctAnswer: "A professional-looking site can still be unreliable; consulting independent sources reveals its actual credibility.", explanation: "Appearance is easy to fake; outside corroboration is what establishes trust." },
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
      { topicSlug: "probability-statistical-reasoning", prompt: "A disease affects only 1 in 10,000 people, and a test for it is '99% accurate.' Someone tests positive and is sure they have it. Why might that certainty be unwarranted?", correctAnswer: "Because the disease is so rare, most positives are false positives — ignoring how uncommon it is wildly overstates the real chance of having it.", explanation: "When a condition is rare, even an accurate test produces mostly false positives." },
      { topicSlug: "evaluating-evidence-science", prompt: "A psychic claims 'invisible energies' guide events, but insists no possible test could ever detect or disprove them. Why is a claim like that worthless as science?", correctAnswer: "If nothing could ever show it false, it makes no testable prediction, so no evidence could ever support or refute it.", explanation: "A claim that rules out any possible test can't be evaluated by evidence." },
      { topicSlug: "decision-making-uncertainty", prompt: "Lottery A: a 1% chance to win $1,000. Lottery B: a 50% chance to win $30. Tickets cost the same. Which is the better bet, and how would you justify it?", correctAnswer: "B — its probability-weighted payoff is $15 versus A's $10, so on average B returns more per ticket.", explanation: "Compare options by probability-weighted value: 0.5×$30 = $15 beats 0.01×$1,000 = $10." },
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
      { topicSlug: "moral-value-reasoning", prompt: "Two statements: (a) 'Violent crime fell 20% last year.' (b) 'The government should spend less on prisons.' Which one could be settled by facts alone, and which involves a value judgment? Explain.", correctAnswer: "(a) is factual and could be checked against data; (b) is a value judgment about what ought to be done and can't be settled by facts alone.", explanation: "Claims about what ought to be can't be derived from facts about what is." },
      { topicSlug: "reasoning-in-writing", prompt: "A student's essay wanders through many points, and readers finish it unable to tell what she was actually arguing for. What is the single most important thing her essay is missing?", correctAnswer: "A clear central claim that the whole essay is organized to support.", explanation: "A piece of persuasive writing needs one main point that everything else backs up." },
      { topicSlug: "detecting-misinformation", prompt: "Two people each share a false story: one was fooled and genuinely believed it; the other knew it was false and spread it anyway to mislead people. Why does the second case deserve harsher judgment?", correctAnswer: "The second person spread it deliberately to deceive, while the first made an honest mistake — the intent to mislead is what makes it worse.", explanation: "Deliberate deception is more culpable than an honest error in sharing something false." },
      { topicSlug: "critical-thinking-across-domains", prompt: "A student is sharp at spotting weak arguments in history class but never applies that skill to the ads and posts she sees online. What is she failing to do?", correctAnswer: "Carry her reasoning skill over into new, everyday situations instead of leaving it confined to one class.", explanation: "Reasoning skills only pay off when deliberately applied across new contexts." },
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
      { topicSlug: "arguments-vs-nonarguments", prompt: "'We should leave now, because the storm is coming.' Is a reason being offered to support a conclusion, or is this just a statement? Explain.", correctAnswer: "A reason is offered — 'the storm is coming' supports the conclusion that we should leave — so it's an argument.", explanation: "A reason given for a claim makes the passage an argument." },
      { topicSlug: "premises-and-conclusions", prompt: "In 'Since taxes rose, prices increased,' what is the reason given, and what conclusion is drawn from it?", correctAnswer: "Reason: taxes rose. Conclusion: prices increased.", explanation: "'Since' flags 'taxes rose' as the support for the conclusion." },
      { topicSlug: "validity-and-soundness", prompt: "An argument has flawless logic and every one of its premises is actually true. What can you say about its conclusion, and why?", correctAnswer: "Its conclusion must be true — valid logic combined with all-true premises guarantees a true conclusion.", explanation: "Validity preserves truth from premises to conclusion." },
      { topicSlug: "deductive-vs-inductive", prompt: "A pollster surveys a representative sample and concludes how the whole country will vote. Does that conclusion follow with certainty, or only with probability? Explain.", correctAnswer: "Only with probability — generalizing from a sample makes the conclusion likely, not guaranteed.", explanation: "Inference from a sample to a population is inductive and uncertain." },
      { topicSlug: "propositional-logic-truth-tables", prompt: "'If it's a dog, then it's an animal. It's not a dog. So it's not an animal.' Does that conclusion really follow? Explain.", correctAnswer: "No — it could still be another animal, like a cat, so the conclusion doesn't follow.", explanation: "Ruling out the condition doesn't rule out the result; the result can hold for other reasons." },
      { topicSlug: "fallacies-of-relevance", prompt: "A senator dismisses a climate study by saying, 'It was funded by people I don't like,' never once addressing its data. What's wrong with that response?", correctAnswer: "It attacks who funded the study instead of its evidence — who paid for it doesn't by itself make the data wrong.", explanation: "Rejecting an argument over its source rather than its content engages nothing about the argument." },
      { topicSlug: "fallacies-weak-induction", prompt: "'I took the supplement and my cold went away, so it cured me.' Why doesn't this show the supplement actually worked?", correctAnswer: "Colds clear up on their own, so recovery happening after the supplement doesn't show the supplement caused it.", explanation: "An event following another isn't evidence the first caused the second." },
      { topicSlug: "cognitive-biases-motivated-reasoning", prompt: "An investor reads only the news predicting his stock will rise and ignores every warning sign. How is this likely to distort his decision?", correctAnswer: "By seeking only confirming news he gets a one-sided picture and underestimates the real risk.", explanation: "Filtering for belief-consistent evidence inflates confidence and hides danger." },
      { topicSlug: "probability-statistical-reasoning", prompt: "Bet A: a 10% chance to win $100. Bet B: a 90% chance to win $15. They cost the same. Which is mathematically the better bet, and why?", correctAnswer: "B — its probability-weighted return is $13.50 versus $10 for A, so on average B pays more.", explanation: "Weigh each payoff by its probability: 0.9×$15 = $13.50 beats 0.1×$100 = $10." },
      { topicSlug: "capstone-synthesis", prompt: "When is a conclusion genuinely worth believing — what has to be true about both its premises and the way they support it?", correctAnswer: "Its premises must be true AND they must properly support the conclusion (the logic valid if deductive, the support strong if inductive).", explanation: "Believable conclusions need both true premises and adequate support." },
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
