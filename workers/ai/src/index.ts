import { Job } from '@imagelabs/shared';

export async function processAiJob(job: Job): Promise<void> {
  console.info(`Processing AI job: ${job.id} for tool ${job.tool}`);
}
