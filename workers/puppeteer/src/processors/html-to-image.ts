import { getBrowser } from '../lib/browser-pool';
import { HtmlToImageOptions } from '@imagelabs/shared';

// SSRF Guard: block private/loopback IP ranges
function isBlockedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();

    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '169.254.169.254' || // AWS/cloud metadata
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return true;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

export async function processHtmlToImage(
  options: HtmlToImageOptions,
): Promise<{ buffer: Buffer; format: string }> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 1. Viewport configuration
    const viewportWidth = options.viewport?.width ?? 1280;
    const viewportHeight = options.viewport?.height ?? 800;
    const deviceScaleFactor = options.viewport?.deviceScaleFactor ?? 1;

    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
      deviceScaleFactor,
    });

    // 2. Navigation / Content Ingestion
    if (options.sourceType === 'url') {
      if (!options.url || isBlockedUrl(options.url)) {
        throw new Error('Access to private/internal network addresses or invalid protocols is forbidden (SSRF protection).');
      }

      await page.goto(options.url, {
        waitUntil: 'networkidle2',
        timeout: 20000,
      });
    } else {
      const rawHtml = options.html || '<html><body><h1>Empty HTML</h1></body></html>';

      // Sandboxed CSP header disallowing local filesystem access or dangerous outbound sockets
      const secureHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: https:; script-src 'self' 'unsafe-inline' https:; connect-src https:;">
          </head>
          <body>
            ${rawHtml}
          </body>
        </html>
      `;

      await page.setContent(secureHtml, {
        waitUntil: 'networkidle0',
        timeout: 15000,
      });
    }

    // Optional delay for web fonts or css animations to settle
    const delay = options.delayMs ?? 500;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 5000)));
    }

    // 3. Screenshot capture
    const format = options.format === 'jpeg' ? 'jpeg' : 'png';
    const screenshotOptions: Record<string, unknown> = {
      type: format,
      fullPage: options.fullPage ?? false,
    };

    if (format === 'jpeg') {
      screenshotOptions.quality = options.quality ?? 90;
    }

    const uint8Array = await page.screenshot(screenshotOptions);
    const buffer = Buffer.from(uint8Array);

    return { buffer, format };
  } finally {
    await page.close().catch(() => {});
  }
}
