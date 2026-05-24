import type { ToolkitRequest } from "./schemas.js";

function formatAdditionalInfo(additionalInfo?: string): string {
  if (!additionalInfo?.trim()) {
    return "";
  }

  return `\n\nTeacher notes:\n${additionalInfo.trim()}`;
}

export function buildToolkitPrompts(
  input: ToolkitRequest,
  sourceText: string,
): { systemPrompt: string; userPrompt: string } {
  switch (input.tool) {
    case "lesson-plan":
      return buildLessonPlanPrompts(input, sourceText);
    case "worksheet":
      return buildWorksheetPrompts(input, sourceText);
    case "differentiated-papers":
      return buildDifferentiatedPapersPrompts(input, sourceText);
    case "chapter-summary":
      return buildChapterSummaryPrompts(input, sourceText);
  }
}

function buildLessonPlanPrompts(
  input: Extract<ToolkitRequest, { tool: "lesson-plan" }>,
  sourceText: string,
) {
  const duration = input.durationMinutes ?? 45;
  const className = input.className ?? "Infer from source material";

  const systemPrompt = `You are an expert teacher and curriculum designer for Indian schools (CBSE/NCERT style).
Return ONLY valid JSON matching the schema below. Do not wrap JSON in markdown fences.

Schema:
{
  "introMessage": "string — friendly 1-2 sentence message to the teacher",
  "title": "string",
  "subject": "string",
  "className": "string",
  "durationMinutes": number,
  "learningObjectives": ["string — 3-5 measurable objectives"],
  "materials": ["string — list of required materials"],
  "introduction": { "activity": "string", "durationMinutes": number },
  "mainActivities": [{ "title": "string", "description": "string", "durationMinutes": number }],
  "assessment": "string — how to check understanding during the lesson",
  "homework": "string — practice assignment linked to the chapter",
  "closingNotes": "string — wrap-up and reflection for the teacher"
}

Rules:
- Base the lesson plan strictly on the provided source material.
- Total activity durations should approximately equal ${duration} minutes.
- Use practical, classroom-ready language for Indian teachers.
- Include at least 2 main activities.`;

  const userPrompt = `Create a ${duration}-minute lesson plan for class: ${className}.

Source material:
"""
${sourceText}
"""${formatAdditionalInfo(input.additionalInfo)}`;

  return { systemPrompt, userPrompt };
}

function buildWorksheetPrompts(
  input: Extract<ToolkitRequest, { tool: "worksheet" }>,
  sourceText: string,
) {
  const questionCount = input.questionCount ?? 10;

  const systemPrompt = `You are an expert teacher creating practice worksheets for Indian schools (CBSE/NCERT style).
Return ONLY valid JSON matching the schema below. Do not wrap JSON in markdown fences.

Schema:
{
  "introMessage": "string",
  "title": "string",
  "subject": "string",
  "className": "string",
  "instructions": "string — student-facing instructions",
  "questions": [{
    "number": 1,
    "text": "string",
    "type": "mcq" | "short" | "fill" | "match",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."]
  }],
  "answerKey": [{ "number": 1, "answer": "string" }]
}

Rules:
- Create exactly ${questionCount} practice questions (NOT a formal exam paper).
- Mix question types: mcq, short, fill-in-the-blank, and match where appropriate.
- Include "options" array only for mcq and match type questions.
- Base ALL questions strictly on the source material.
- Keep language appropriate for the inferred class level.
- Number questions sequentially from 1 to ${questionCount}.`;

  const userPrompt = `Create a practice worksheet with ${questionCount} questions from this source material:

"""
${sourceText}
"""${formatAdditionalInfo(input.additionalInfo)}`;

  return { systemPrompt, userPrompt };
}

function buildDifferentiatedPapersPrompts(
  input: Extract<ToolkitRequest, { tool: "differentiated-papers" }>,
  sourceText: string,
) {
  const questionCount = input.questionCount ?? 10;

  const systemPrompt = `You are an expert teacher creating differentiated assessment papers for Indian schools (CBSE/NCERT style).
Return ONLY valid JSON matching the schema below. Do not wrap JSON in markdown fences.

Schema:
{
  "introMessage": "string",
  "variants": [
    {
      "level": "Easy",
      "header": {
        "subject": "string",
        "className": "string",
        "timeAllowedMinutes": number,
        "maximumMarks": number,
        "generalInstructions": "string"
      },
      "questions": [{
        "number": 1,
        "text": "string",
        "marks": number,
        "type": "string",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."]
      }],
      "answerKey": [{ "number": 1, "answer": "string" }]
    }
  ]
}

Rules:
- Create exactly 3 variants with levels: "Easy", "Moderate", "Challenging" (in that order).
- Each variant must have exactly ${questionCount} questions on the SAME topic from the source material.
- Easy: simpler recall and basic application; Moderate: standard exam level; Challenging: higher-order thinking.
- Include MCQ options where the question type is MCQ.
- Number questions 1 to ${questionCount} within each variant.
- Provide a complete answer key for each variant.`;

  const userPrompt = `Create 3 differentiated papers (Easy, Moderate, Challenging) with ${questionCount} questions each from this source material:

"""
${sourceText}
"""${formatAdditionalInfo(input.additionalInfo)}`;

  return { systemPrompt, userPrompt };
}

function buildChapterSummaryPrompts(
  input: Extract<ToolkitRequest, { tool: "chapter-summary" }>,
  sourceText: string,
) {
  const lengthGuide = {
    short: "Keep the summary to 2-3 concise paragraphs. Include 4-5 key points.",
    medium:
      "Write a balanced summary of 4-5 paragraphs. Include 6-8 key points.",
    detailed:
      "Write a comprehensive summary of 6-8 paragraphs. Include 8-10 key points.",
  }[input.summaryLength ?? "medium"];

  const systemPrompt = `You are an expert teacher creating revision handouts for Indian schools (CBSE/NCERT style).
Return ONLY valid JSON matching the schema below. Do not wrap JSON in markdown fences.

Schema:
{
  "introMessage": "string",
  "title": "string",
  "subject": "string",
  "className": "string",
  "keyPoints": ["string — bullet-style key takeaways"],
  "summary": "string — flowing revision text for students",
  "importantTerms": [{ "term": "string", "definition": "string" }],
  "revisionQuestions": ["string — 5 short self-check questions"]
}

Rules:
- Base everything strictly on the provided source material.
- ${lengthGuide}
- Include 5-8 important terms with clear definitions.
- Include exactly 5 revision questions students can answer without looking at notes.
- Use student-friendly language suitable for quick revision before exams.`;

  const userPrompt = `Create a one-page style chapter summary revision handout from this source material:

"""
${sourceText}
"""${formatAdditionalInfo(input.additionalInfo)}`;

  return { systemPrompt, userPrompt };
}
