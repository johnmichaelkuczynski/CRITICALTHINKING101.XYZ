# 🎓 Critical Thinking 101

**The Critical Thinking Studio — Executable College Coursework**

---

## 🧩 Overview

Critical Thinking 101 is a full-service self-paced learning platform that delivers a complete four-week college-freshman Critical Thinking course — taught, tutored, drilled, graded, and integrity-checked entirely by AI.

It performs end-to-end coursework: depth-adjustable lectures, section-scoped Socratic tutoring, adaptive problem generation, and rubric-faithful AI grading — from a 90-second concept skim all the way to a full midterm and final with per-problem rationales.

Designed for **students, instructors evaluating AI-taught coursework, and academic-integrity researchers**, it merges a real 29-topic critical-thinking syllabus with two layers of AI-authorship detection — producing a course that students can trust to be fair and that instructors can trust to be honest.

---

## 🧠 What It Does

- **Four-Week Structured Curriculum** — A complete critical-thinking syllabus across 29 topics: claims and arguments, premises and conclusions, deductive and inductive reasoning, informal fallacies, cognitive biases, evidence and source evaluation, probability and causation, and rhetoric and persuasion. Each week ships with lectures, homework, and a test; week four adds a midterm and a final.
- **Three-Depth Lectures** — Every lecture is available at **Short / Medium / Long** length, AI-rewritten while preserving the same worked examples and learning objectives. Skim the concept, expand it on demand, or read the textbook-style deep cut.
- **Section-Scoped AI Tutor** — Ask a question about the paragraph you're reading and the answer streams back token-by-token, grounded in that exact lecture section. Suggested starter questions are pre-generated per lecture.
- **Adaptive Topic Practice** — Generated problem sets that move difficulty up after a streak and down after a miss, with worked explanations on every answer. Per-session difficulty persists, so each drill picks up where the last one left off.
- **AI-Graded Assignments** — Homework, tests, midterm, and final are scored by an LLM grader that returns per-problem correctness *plus* a written rationale, then rolls up to a percent score on the attempt.
- **Two-Layer AI-Authorship Detection** — Each submitted answer is screened by both a static text classifier (GPTZero) and a diachronic keystroke-pattern detector. Each verdict ships with a human-readable rationale.
- **Live Analytics** — Dashboard KPIs (attempts, accuracy, streak), per-topic mastery percentages, and a recent-activity feed — so progress, weak spots, and momentum are all visible at a glance.
- **Operator Diagnostics** — Two one-click self-tests verify the entire stack — database, OpenAI, GPTZero, detection pipeline, and the practice/grade loop — before you trust a session.

---

## ⚙️ Technical Features

- **Static Text Detection (GPTZero):** Every submitted answer is sent to GPTZero's `predict/text` endpoint; the per-document AI probability is blended `0.85 × GPTZero + 0.15 × structural-heuristic` for the final score. If GPTZero is unavailable, the system silently falls back to an LLM scorer plus heuristic — submissions never block.
- **Diachronic Keystroke Detection:** The student textarea captures keystroke count, erase count, bulk-insert events, longest bulk insert, rewrite segments, and total duration. A scorer penalizes paste-then-reword behavior, low keystroke-to-output ratios, and impossibly sustained typing speeds — catching AI use even when the final text is reworded enough to pass GPTZero.
- **System Diagnostic (`/diagnostics/system`):** Eight ordered checks — environment, database round-trip, course-seed integrity, OpenAI chat completion, OpenAI JSON mode, detection pipeline, AI-positive control sample, and GPTZero connectivity. Each step returns pass/fail, timing, and a raw error string.
- **Synthetic-Student Diagnostic (`/diagnostics/synthetic-run`):** Spins up a fake student, runs a practice session (wrong → adjust ↓ → right → adjust ↑), takes a full assignment attempt, submits it, and verifies grading + detection + analytics all reflect the run. End-to-end stack proof in one click.
- **Contract-First API:** A single OpenAPI document is the source of truth; React Query hooks for the UI and Zod validators for the server are generated from it. Request and response shapes can't drift between client and server because both come from the same spec.
- **Streaming AI Tutor:** Token-by-token Server-Sent-Event streaming for tutor answers, with a section-scoped system prompt so responses stay grounded in the lecture the student is reading.
- **Adaptive Practice Engine:** Per-session difficulty (1–4 continuous) adjusts after each attempt; the next-problem generator takes the current difficulty and the topic as input, so the question pool is generated on demand instead of pre-baked.
- **Real-React Demo Video:** The 62-second product walkthrough is a real React app, not a slideshow: persistent sidebar, animated SVG cursor, character-by-character typing, word-by-word streaming responses, and scene-synced background audio — all exported as MP4 from a single browser tab.

---

## 🎓 Designed For

- **College Freshmen & Self-Learners:** A complete one-month critical-thinking course delivered with on-demand tutoring and adaptive practice — no instructor required.
- **Instructors & Curriculum Designers:** A working reference for what AI-taught, AI-graded, AI-detection-screened coursework actually looks like end-to-end.
- **Academic-Integrity Researchers:** A live testbed for layered AI-authorship detection that combines text-based classification with behavioral keystroke evidence.
- **Product & Engineering Teams:** A reference implementation of contract-first full-stack architecture, streaming AI UX, and self-diagnostic operator tooling in a pnpm monorepo.

---

## 💡 Core Idea

Critical Thinking 101 redefines an AI-taught course as a *closed accountability loop*.

It doesn't just teach the material and grade the homework — it **teaches**, **tutors**, **drills**, **grades**, **detects misuse**, and **proves the whole pipeline still works** with a single click. The result is a self-paced course students can actually trust to be fair, and that instructors can actually trust to be honest.

**Critical Thinking 101 — where the curriculum, the tutor, the grader, and the integrity check all live in one room.**
