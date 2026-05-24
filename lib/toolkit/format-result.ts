import type {
  ChapterSummary,
  DifferentiatedPapers,
  LessonPlan,
  Worksheet,
} from "./types";

export function formatLessonPlanText(plan: LessonPlan): string {
  const lines = [
    plan.title,
    `${plan.subject} · Class ${plan.className} · ${plan.durationMinutes} minutes`,
    "",
    "Learning Objectives",
    ...plan.learningObjectives.map((item) => `- ${item}`),
    "",
    "Materials",
    ...plan.materials.map((item) => `- ${item}`),
    "",
    `Introduction (${plan.introduction.durationMinutes} min)`,
    plan.introduction.activity,
    "",
    "Main Activities",
    ...plan.mainActivities.flatMap((activity) => [
      `${activity.title} (${activity.durationMinutes} min)`,
      activity.description,
      "",
    ]),
    "Assessment",
    plan.assessment,
    "",
    "Homework",
    plan.homework,
    "",
    "Closing Notes",
    plan.closingNotes,
  ];

  return lines.join("\n").trim();
}

export function formatWorksheetText(worksheet: Worksheet): string {
  const lines = [
    worksheet.title,
    `${worksheet.subject} · Class ${worksheet.className}`,
    "",
    "Instructions",
    worksheet.instructions,
    "",
    "Questions",
    ...worksheet.questions.flatMap((question) => {
      const items = [`${question.number}. [${question.type}] ${question.text}`];
      if (question.options?.length) {
        items.push(...question.options.map((option) => `   ${option}`));
      }
      return items;
    }),
    "",
    "Answer Key",
    ...worksheet.answerKey.map(
      (entry) => `${entry.number}. ${entry.answer}`,
    ),
  ];

  return lines.join("\n").trim();
}

export function formatDifferentiatedPapersText(
  papers: DifferentiatedPapers,
): string {
  return papers.variants
    .map((variant) => {
      const lines = [
        `${variant.level} Paper`,
        `${variant.header.subject} · Class ${variant.header.className}`,
        `Time: ${variant.header.timeAllowedMinutes} min · Marks: ${variant.header.maximumMarks}`,
        "",
        variant.header.generalInstructions,
        "",
        ...variant.questions.flatMap((question) => {
          const items = [
            `${question.number}. (${question.marks} marks) ${question.text}`,
          ];
          if (question.options?.length) {
            items.push(...question.options.map((option) => `   ${option}`));
          }
          return items;
        }),
        "",
        "Answer Key",
        ...variant.answerKey.map(
          (entry) => `${entry.number}. ${entry.answer}`,
        ),
      ];

      return lines.join("\n");
    })
    .join("\n\n" + "=".repeat(40) + "\n\n")
    .trim();
}

export function formatChapterSummaryText(summary: ChapterSummary): string {
  const lines = [
    summary.title,
    `${summary.subject} · Class ${summary.className}`,
    "",
    "Key Points",
    ...summary.keyPoints.map((item) => `- ${item}`),
    "",
    "Summary",
    summary.summary,
    "",
    "Important Terms",
    ...summary.importantTerms.map(
      (item) => `${item.term}: ${item.definition}`,
    ),
    "",
    "Revision Questions",
    ...summary.revisionQuestions.map((item, index) => `${index + 1}. ${item}`),
  ];

  return lines.join("\n").trim();
}
