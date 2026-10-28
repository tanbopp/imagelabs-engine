import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { BlurFaceOptions } from '@imagelabs/shared';

export async function processBlurFace(
  inputBuffer: Buffer,
  options: BlurFaceOptions = { blurStrength: 35, padding: 0.1 },
): Promise<{ buffer: Buffer; format: string }> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'imagelabs-blurface-'));
  const inputPath = path.join(tmpDir, 'input.png');
  const outputPath = path.join(tmpDir, 'output.png');

  try {
    await fs.writeFile(inputPath, inputBuffer);

    const scriptPath = path.resolve(__dirname, '../../python/blur_face.py');
    const blurStrength = String(options.blurStrength ?? 35);
    const padding = String(options.padding ?? 0.1);

    const args = [
      scriptPath,
      '--input',
      inputPath,
      '--output',
      outputPath,
      '--blur-strength',
      blurStrength,
      '--padding',
      padding,
    ];

    if (options.faces && options.faces.length > 0) {
      args.push('--faces-json', JSON.stringify(options.faces));
    }

    await new Promise<void>((resolve, reject) => {
      const py = spawn('python', args);

      let stderr = '';
      py.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      py.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Blur face Python process exited with code ${code}: ${stderr}`));
        }
      });

      py.on('error', (err) => {
        reject(new Error(`Failed to spawn Python blur_face process: ${err.message}`));
      });
    });

    const outputBuffer = await fs.readFile(outputPath);
    return { buffer: outputBuffer, format: 'png' };
  } finally {
    // Zero data retention: Clean up scratch files immediately
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
