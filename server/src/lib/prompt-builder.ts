import { z } from "zod";
import type { generateRequestSchema } from "./question-paper-schema.js";

type GenerateInput = z.infer<typeof generateRequestSchema>;

const QUESTION_TYPE_LABELS: Record<
  GenerateInput["questionRows"][number]["type"],
  string
> = {
  mcq: "Multiple Choice Questions",
  short: "Short Answer Questions",
  diagram: "Diagram/Graph-Based Questions",
  numerical: "Numerical Problems",
};

export function buildQuestionPaperPrompts(
  input: GenerateInput,
  sourceText: string,
) {
  const totalQuestions = input.questionRows.reduce(
    (sum, row) => sum + row.count,
    0,
  );
  const totalMarks = input.questionRows.reduce(
    (sum, row) => sum + row.count * row.marks,
    0,
  );

  const sectionSpec = input.questionRows
    .map((row, index) => {
      const sectionId = String.fromCharCode(65 + index);
      const label = QUESTION_TYPE_LABELS[row.type];

      return `- Section ${sectionId}: ${label}
  - Question count: exactly ${row.count}
  - Marks per question: exactly ${row.marks}
  - For MCQ rows, include 4 options (A–D) in the "options" array`;
    })
    .join("\n");

  const systemPrompt = `You are an expert teacher and exam paper designer for Indian schools (CBSE/NCERT style).
Return ONLY valid JSON matching the schema below. Do not wrap JSON in markdown fences.

Schema:
{
  "introMessage": "string — friendly 1-2 sentence message to the teacher confirming the paper",
  "header": {
    "institutionName": "string",
    "subject": "string",
    "className": "string",
    "timeAllowedMinutes": number,
    "maximumMarks": number,
    "generalInstructions": "string"
  },
  "sections": [
    {
      "id": "A",
      "title": "Section A",
      "questionType": "string",
      "instructions": "string",
      "marksPerQuestion": number,
      "questions": [
        {
          "number": 1,
          "text": "string",
          "difficulty": "Easy" | "Moderate" | "Challenging",
          "marks": number,
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."]
        }
      ]
    }
  ],
  "answerKey": [{ "number": 1, "answer": "string" }]
}

Rules:
- Base ALL questions strictly on the provided source material.
- Create exactly the sections and question counts specified.
- Number questions sequentially across the entire paper (1, 2, 3...).
- Each question must include exact marks requested and a difficulty level (Easy, Moderate, or Challenging).
- Section title should be like "Section A" and questionType should be the question category (e.g. "Multiple Choice Questions").
- header.maximumMarks must equal ${totalMarks}.
- Include an answer key entry for every question (${totalQuestions} total).
- Infer subject, class/grade, and institution from source + teacher notes when possible; otherwise use reasonable placeholders.
- Estimate timeAllowedMinutes from total marks (roughly 1.5–2 minutes per mark).
- Use LaTeX-style notation for equations when needed (e.g. H2O, 2H2 + O2 -> 2H2O).
- For diagram questions, describe the diagram the student should draw or interpret in the question text.
- Do NOT include markdown in JSON string values.`;

  const userPrompt = `SOURCE MATERIAL (from uploaded file "${input.uploadedFile.originalName}"):
"""
${sourceText}
"""

TEACHER REQUIREMENTS:
${sectionSpec}

Total questions: ${totalQuestions}
Total marks: ${totalMarks}
${input.dueDate ? `Assignment due date: ${input.dueDate}` : ""}
${input.additionalInfo?.trim() ? `\nAdditional teacher instructions:\n${input.additionalInfo.trim()}` : ""}

Generate the complete question paper JSON now.`;

  return { systemPrompt, userPrompt, totalQuestions, totalMarks };
}
