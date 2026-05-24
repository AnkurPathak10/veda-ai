export type ToolkitToolId =
  | "lesson-plan"
  | "worksheet"
  | "differentiated-papers"
  | "chapter-summary";

export type UploadedFileRef = {
  filename: string;
  originalName: string;
  mimeType: string;
};

export type LessonPlan = {
  introMessage: string;
  title: string;
  subject: string;
  className: string;
  durationMinutes: number;
  learningObjectives: string[];
  materials: string[];
  introduction: {
    activity: string;
    durationMinutes: number;
  };
  mainActivities: Array<{
    title: string;
    description: string;
    durationMinutes: number;
  }>;
  assessment: string;
  homework: string;
  closingNotes: string;
};

export type Worksheet = {
  introMessage: string;
  title: string;
  subject: string;
  className: string;
  instructions: string;
  questions: Array<{
    number: number;
    text: string;
    type: "mcq" | "short" | "fill" | "match";
    options?: string[];
  }>;
  answerKey: Array<{
    number: number;
    answer: string;
  }>;
};

export type DifferentiatedPapers = {
  introMessage: string;
  variants: Array<{
    level: "Easy" | "Moderate" | "Challenging";
    header: {
      subject: string;
      className: string;
      timeAllowedMinutes: number;
      maximumMarks: number;
      generalInstructions: string;
    };
    questions: Array<{
      number: number;
      text: string;
      marks: number;
      type: string;
      options?: string[];
    }>;
    answerKey: Array<{
      number: number;
      answer: string;
    }>;
  }>;
};

export type ChapterSummary = {
  introMessage: string;
  title: string;
  subject: string;
  className: string;
  keyPoints: string[];
  summary: string;
  importantTerms: Array<{
    term: string;
    definition: string;
  }>;
  revisionQuestions: string[];
};

export type ToolkitResult =
  | LessonPlan
  | Worksheet
  | DifferentiatedPapers
  | ChapterSummary;

export type LessonPlanRequest = {
  tool: "lesson-plan";
  uploadedFile: UploadedFileRef;
  durationMinutes?: number;
  className?: string;
  additionalInfo?: string;
};

export type WorksheetRequest = {
  tool: "worksheet";
  uploadedFile: UploadedFileRef;
  questionCount?: number;
  additionalInfo?: string;
};

export type DifferentiatedPapersRequest = {
  tool: "differentiated-papers";
  uploadedFile: UploadedFileRef;
  questionCount?: number;
  additionalInfo?: string;
};

export type ChapterSummaryRequest = {
  tool: "chapter-summary";
  uploadedFile: UploadedFileRef;
  summaryLength?: "short" | "medium" | "detailed";
  additionalInfo?: string;
};

export type ToolkitGenerateRequest =
  | LessonPlanRequest
  | WorksheetRequest
  | DifferentiatedPapersRequest
  | ChapterSummaryRequest;

export type JobStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

export type StartToolkitGenerationResponse = {
  jobId: string;
  status: JobStatus;
};

export type ToolkitJobStatusResponse = {
  jobId: string;
  status: JobStatus;
  progress?: number;
  tool?: ToolkitToolId;
  result?: ToolkitResult;
  model?: string;
  error?: string;
};

export type GenerateToolkitResponse = {
  tool: ToolkitToolId;
  result: ToolkitResult;
  model: string;
};
