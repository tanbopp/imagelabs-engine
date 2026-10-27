import { Job } from '@imagelabs/shared';

export async function processPuppeteerJob(job: Job): Promise<void> {
  console.info(`Processing Puppeteer job: ${job.id} for tool ${job.tool}`);
}
