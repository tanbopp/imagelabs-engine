import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { UpscaleOptions } from '@imagelabs/shared';

export async function processUpscale(
  inputBuffer: Buffer,
  options: UpscaleOptions = { scale: '2x' },
): Promise<{ buffer: Buffer; format: string }> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'imagelabs-upscale-'));
  const inputPath = path.join(tmpDir, 'input.png');
  const outputPath = path.join(tmpDir, 'output.png');

  try {
    await fs.writeFile(inputPath, inputBuffer);

    const scriptPath = path.resolve(__dirname, '../../python/upscale.py');
    const scale = options.scale || '2x';

    await new Promise<void>((resolve, reject) => {
      const py = spawn('python', [scriptPath, '--input', inputPath, '--output', outputPath, '--scale', scale]);

      let stderr = '';
      py.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      py.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Upscale Python process exited with code ${code}: ${stderr}`));
        }
      });

      py.on('error', (err) => {
        reject(new Error(`Failed to spawn Python upscale process: ${err.message}`));
      });
    });

    const outputBuffer = await fs.readFile(outputPath);
    return { buffer: outputBuffer, format: 'png' };
  } finally {
    // Zero data retention: Clean up scratch files immediately
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
