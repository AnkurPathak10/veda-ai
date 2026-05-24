import type { Job } from "bullmq";

export function isFinalJobFailure(job: Job | undefined): boolean {
  if (!job) {
    return true;
  }

  const maxAttempts = job.opts.attempts ?? 1;
  return job.attemptsMade >= maxAttempts;
}
