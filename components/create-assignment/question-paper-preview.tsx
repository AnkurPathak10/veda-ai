"use client";

import { Download } from "lucide-react";
import type { QuestionPaper } from "@/lib/create-assignment/question-paper";

type QuestionPaperPreviewProps = {
  questionPaper: QuestionPaper;
};

export function QuestionPaperPreview({
  questionPaper,
}: QuestionPaperPreviewProps) {
  const { introMessage, header, sections, answerKey } = questionPaper;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* AI intro bubble */}
      <div className="rounded-2xl bg-[#2d2d2d] px-5 py-4 text-white">
        <p className="text-sm leading-relaxed sm:text-base">{introMessage}</p>
        <button
          type="button"
          onClick={handlePrint}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20 sm:text-sm"
        >
          <Download className="h-4 w-4" />
          Download as PDF
        </button>
      </div>

      {/* Question paper document */}
      <div
        id="question-paper-document"
        className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-8 print:border-0 print:shadow-none"
      >
        <div className="text-center">
          <h2 className="text-lg font-bold text-[#1a1a1a] sm:text-xl">
            {header.institutionName}
          </h2>
          <p className="mt-2 text-sm text-[#374151]">
            Subject: {header.subject}
          </p>
          <p className="text-sm text-[#374151]">Class: {header.className}</p>
        </div>

        <div className="mt-5 flex flex-col gap-2 text-sm text-[#374151] sm:flex-row sm:justify-between">
          <span>Time Allowed: {header.timeAllowedMinutes} minutes</span>
          <span>Maximum Marks: {header.maximumMarks}</span>
        </div>

        <p className="mt-4 text-sm text-[#374151]">
          {header.generalInstructions}
        </p>

        <div className="mt-5 space-y-3 border-t border-[#e5e7eb] pt-5 text-sm text-[#374151]">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <span>
              Name: <span className="inline-block min-w-[180px] border-b border-[#d1d5db]" />
            </span>
            <span>
              Roll Number:{" "}
              <span className="inline-block min-w-[120px] border-b border-[#d1d5db]" />
            </span>
          </div>
          <span>
            Class: {header.className} Section:{" "}
            <span className="inline-block min-w-[80px] border-b border-[#d1d5db]" />
          </span>
        </div>

        {sections.map((section) => (
          <div key={section.id} className="mt-8">
            <h3 className="text-center text-base font-bold text-[#1a1a1a]">
              {section.title}
            </h3>
            <p className="mt-2 text-center text-sm font-medium text-[#374151]">
              {section.questionType}
            </p>
            <p className="mt-1 text-center text-sm text-[#6b7280]">
              {section.instructions}
            </p>

            <ol className="mt-5 space-y-4">
              {section.questions.map((question) => (
                <li key={question.number} className="text-sm text-[#1a1a1a]">
                  <p>
                    <span className="font-medium">{question.number}.</span>{" "}
                    <span className="text-[#6b7280]">
                      [{question.difficulty}]
                    </span>{" "}
                    {question.text}{" "}
                    <span className="text-[#6b7280]">
                      [{question.marks} Mark{question.marks === 1 ? "" : "s"}]
                    </span>
                  </p>
                  {question.options && question.options.length > 0 && (
                    <ul className="mt-2 ml-6 list-none space-y-1 text-[#374151]">
                      {question.options.map((option) => (
                        <li key={option}>{option}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}

        <p className="mt-10 text-center text-sm font-medium text-[#6b7280]">
          End of Question Paper
        </p>

        <div className="mt-8 border-t border-[#e5e7eb] pt-6">
          <h4 className="text-base font-bold text-[#1a1a1a]">Answer Key:</h4>
          <ol className="mt-4 space-y-3">
            {answerKey.map((entry) => (
              <li key={entry.number} className="text-sm text-[#374151]">
                <span className="font-medium text-[#1a1a1a]">
                  {entry.number}.
                </span>{" "}
                {entry.answer}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
