import { z } from "zod";

const difficultySchema = z.enum(["Easy", "Moderate", "Challenging"]);

const questionSchema = z.object({
  number: z.number().int().positive(),
  difficulty: difficultySchema,
  text: z.string().min(1),
  marks: z.number().int().positive(),
  options: z.array(z.string().min(1)).optional(),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  questionType: z.string().min(1),
  instructions: z.string().min(1),
  marksPerQuestion: z.number().int().positive(),
  questions: z.array(questionSchema).min(1),
});

export const questionPaperSchema = z.object({
  introMessage: z.string().min(1),
  header: z.object({
    institutionName: z.string().min(1),
    subject: z.string().min(1),
    className: z.string().min(1),
    timeAllowedMinutes: z.number().int().positive(),
    maximumMarks: z.number().int().positive(),
    generalInstructions: z.string().min(1),
  }),
  sections: z.array(sectionSchema).min(1),
  answerKey: z
    .array(
      z.object({
        number: z.number().int().positive(),
        answer: z.string().min(1),
      }),
    )
    .min(1),
});

export type ParsedQuestionPaper = z.infer<typeof questionPaperSchema>;

export const generateRequestSchema = z.object({
  uploadedFile: z.object({
    filename: z.string().min(1),
    originalName: z.string().min(1),
    mimeType: z.string().min(1),
  }),
  questionRows: z
    .array(
      z.object({
        type: z.enum(["mcq", "short", "diagram", "numerical"]),
        count: z.number().int().min(1).max(50),
        marks: z.number().int().min(1).max(100),
      }),
    )
    .min(1),
  additionalInfo: z.string().max(4000).optional(),
  dueDate: z.string().optional(),
});
