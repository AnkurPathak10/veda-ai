"use client";

import { useState } from "react";
import type {
  ChapterSummary,
  DifferentiatedPapers,
  LessonPlan,
  ToolkitResult,
  ToolkitToolId,
  Worksheet,
} from "@/lib/toolkit/types";
import { ToolkitResultCard } from "./toolkit-tool-shell";

const levelStyles = {
  Easy: "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]",
  Moderate: "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
  Challenging: "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]",
} as const;

function LessonPlanPreview({ result }: { result: LessonPlan }) {
  return (
    <ToolkitResultCard title={result.title}>
      <p className="text-sm text-[#6b7280]">
        {result.subject} · Class {result.className} · {result.durationMinutes}{" "}
        minutes
      </p>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">
          Learning Objectives
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#374151]">
          {result.learningObjectives.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Materials</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#374151]">
          {result.materials.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">
          Introduction ({result.introduction.durationMinutes} min)
        </h3>
        <p className="mt-2 text-sm text-[#374151]">
          {result.introduction.activity}
        </p>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Main Activities</h3>
        <div className="mt-3 space-y-4">
          {result.mainActivities.map((activity) => (
            <div
              key={activity.title}
              className="rounded-xl border border-[#f3f4f6] bg-[#fafafa] p-4"
            >
              <p className="text-sm font-semibold text-[#1a1a1a]">
                {activity.title} ({activity.durationMinutes} min)
              </p>
              <p className="mt-2 text-sm text-[#374151]">
                {activity.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Assessment</h3>
        <p className="mt-2 text-sm text-[#374151]">{result.assessment}</p>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Homework</h3>
        <p className="mt-2 text-sm text-[#374151]">{result.homework}</p>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Closing Notes</h3>
        <p className="mt-2 text-sm text-[#374151]">{result.closingNotes}</p>
      </section>
    </ToolkitResultCard>
  );
}

function WorksheetPreview({ result }: { result: Worksheet }) {
  return (
    <ToolkitResultCard title={result.title}>
      <p className="text-sm text-[#6b7280]">
        {result.subject} · Class {result.className}
      </p>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Instructions</h3>
        <p className="mt-2 text-sm text-[#374151]">{result.instructions}</p>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Questions</h3>
        <div className="mt-3 space-y-4">
          {result.questions.map((question) => (
            <div
              key={question.number}
              className="rounded-xl border border-[#f3f4f6] bg-[#fafafa] p-4"
            >
              <p className="text-sm font-medium text-[#1a1a1a]">
                {question.number}. [{question.type}] {question.text}
              </p>
              {question.options?.length ? (
                <ul className="mt-2 space-y-1 pl-4 text-sm text-[#374151]">
                  {question.options.map((option) => (
                    <li key={option}>{option}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Answer Key</h3>
        <div className="mt-3 space-y-2">
          {result.answerKey.map((entry) => (
            <p key={entry.number} className="text-sm text-[#374151]">
              <span className="font-medium text-[#1a1a1a]">{entry.number}.</span>{" "}
              {entry.answer}
            </p>
          ))}
        </div>
      </section>
    </ToolkitResultCard>
  );
}

function DifferentiatedPapersPreview({
  result,
}: {
  result: DifferentiatedPapers;
}) {
  const [activeVariant, setActiveVariant] = useState(0);
  const variant = result.variants[activeVariant];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {result.variants.map((entry, index) => (
          <button
            key={entry.level}
            type="button"
            onClick={() => setActiveVariant(index)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              activeVariant === index
                ? levelStyles[entry.level]
                : "border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f9fafb]"
            }`}
          >
            {entry.level}
          </button>
        ))}
      </div>

      <ToolkitResultCard title={`${variant.level} Paper`}>
        <p className="text-sm text-[#6b7280]">
          {variant.header.subject} · Class {variant.header.className} ·{" "}
          {variant.header.timeAllowedMinutes} min · {variant.header.maximumMarks}{" "}
          marks
        </p>
        <section>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Instructions</h3>
          <p className="mt-2 text-sm text-[#374151]">
            {variant.header.generalInstructions}
          </p>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Questions</h3>
          <div className="mt-3 space-y-4">
            {variant.questions.map((question) => (
              <div
                key={question.number}
                className="rounded-xl border border-[#f3f4f6] bg-[#fafafa] p-4"
              >
                <p className="text-sm font-medium text-[#1a1a1a]">
                  {question.number}. ({question.marks} marks) {question.text}
                </p>
                {question.options?.length ? (
                  <ul className="mt-2 space-y-1 pl-4 text-sm text-[#374151]">
                    {question.options.map((option) => (
                      <li key={option}>{option}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Answer Key</h3>
          <div className="mt-3 space-y-2">
            {variant.answerKey.map((entry) => (
              <p key={entry.number} className="text-sm text-[#374151]">
                <span className="font-medium text-[#1a1a1a]">
                  {entry.number}.
                </span>{" "}
                {entry.answer}
              </p>
            ))}
          </div>
        </section>
      </ToolkitResultCard>
    </>
  );
}

function ChapterSummaryPreview({ result }: { result: ChapterSummary }) {
  return (
    <ToolkitResultCard title={result.title}>
      <p className="text-sm text-[#6b7280]">
        {result.subject} · Class {result.className}
      </p>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Key Points</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#374151]">
          {result.keyPoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Summary</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#374151]">
          {result.summary}
        </p>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Important Terms</h3>
        <div className="mt-3 space-y-3">
          {result.importantTerms.map((item) => (
            <div
              key={item.term}
              className="rounded-xl border border-[#f3f4f6] bg-[#fafafa] p-4"
            >
              <p className="text-sm font-semibold text-[#1a1a1a]">{item.term}</p>
              <p className="mt-1 text-sm text-[#374151]">{item.definition}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-[#1a1a1a]">
          Revision Questions
        </h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-[#374151]">
          {result.revisionQuestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </ToolkitResultCard>
  );
}

type ToolkitResultPreviewProps = {
  tool: ToolkitToolId;
  result: ToolkitResult;
};

export function ToolkitResultPreview({
  tool,
  result,
}: ToolkitResultPreviewProps) {
  switch (tool) {
    case "lesson-plan":
      return <LessonPlanPreview result={result as LessonPlan} />;
    case "worksheet":
      return <WorksheetPreview result={result as Worksheet} />;
    case "differentiated-papers":
      return (
        <DifferentiatedPapersPreview result={result as DifferentiatedPapers} />
      );
    case "chapter-summary":
      return <ChapterSummaryPreview result={result as ChapterSummary} />;
  }
}

export function getToolkitIntroMessage(result: ToolkitResult): string | null {
  if (
    typeof result === "object" &&
    result !== null &&
    "introMessage" in result &&
    typeof result.introMessage === "string"
  ) {
    return result.introMessage;
  }

  return null;
}
