import type { QuestionTypeValue } from "./constants";

export type QuestionDifficulty = "Easy" | "Moderate" | "Challenging";

export type GeneratedQuestion = {
  number: number;
  text: string;
  difficulty?: QuestionDifficulty;
  marks: number;
  options?: string[];
};

export type QuestionPaperSection = {
  id: string;
  title: string;
  questionType: string;
  instructions: string;
  marksPerQuestion: number;
  questions: GeneratedQuestion[];
};

export type QuestionPaperHeader = {
  institutionName: string;
  subject: string;
  className: string;
  timeAllowedMinutes: number;
  maximumMarks: number;
  generalInstructions: string;
};

export type QuestionPaperAnswer = {
  number: number;
  answer: string;
};

export type QuestionPaper = {
  introMessage: string;
  header: QuestionPaperHeader;
  sections: QuestionPaperSection[];
  answerKey: QuestionPaperAnswer[];
};

export type GenerateQuestionPaperRequest = {
  uploadedFile: {
    filename: string;
    originalName: string;
    mimeType: string;
  };
  questionRows: Array<{
    type: QuestionTypeValue;
    count: number;
    marks: number;
  }>;
  additionalInfo?: string;
  dueDate?: string;
};

export type JobStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

export type StartGenerationResponse = {
  jobId: string;
  status: JobStatus;
};

export type JobStatusResponse = {
  jobId: string;
  status: JobStatus;
  progress?: number;
  questionPaper?: QuestionPaper;
  model?: string;
  error?: string;
};

export type GenerateQuestionPaperResponse = {
  questionPaper: QuestionPaper;
  model: string;
};
