// Dropbox Chooser & Saver client loader
declare global {
  interface Window {
    Dropbox?: any;
  }
}

let dropboxScriptLoaded = false;

export async function loadDropboxScript(): Promise<void> {
  if (dropboxScriptLoaded || window.Dropbox) return;

  const appKey = (import.meta as any).env?.VITE_DROPBOX_APP_KEY || 'dummy-dropbox-app-key';

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
    script.id = 'dropboxjs';
    script.setAttribute('data-app-key', appKey);
    script.async = true;
    script.onload = () => {
      dropboxScriptLoaded = true;
      resolve();
    };
    document.body.appendChild(script);
  });
}

export interface DropboxFileResult {
  name: string;
  link: string;
  bytes: number;
  blob: Blob;
}

export async function openDropboxChooser(): Promise<DropboxFileResult[]> {
  await loadDropboxScript();

  if (!window.Dropbox) {
    throw new Error('Dropbox SDK failed to load');
  }

  return new Promise((resolve) => {
    window.Dropbox.choose({
      success: async (files: Array<{ name: string; link: string; bytes: number }>) => {
        const results: DropboxFileResult[] = [];

        for (const file of files) {
          try {
            const res = await fetch(file.link);
            const blob = await res.blob();
            results.push({
              name: file.name,
              link: file.link,
              bytes: file.bytes,
              blob,
            });
          } catch (err) {
            console.error(`Failed to fetch Dropbox file ${file.name}:`, err);
          }
        }

        resolve(results);
      },
      cancel: () => {
        resolve([]);
      },
      linkType: 'direct',
      multiselect: true,
      extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.avif'],
    });
  });
}

export async function exportToDropbox(fileUrl: string, filename: string): Promise<void> {
  await loadDropboxScript();

  if (!window.Dropbox) {
    throw new Error('Dropbox SDK failed to load');
  }

  return new Promise((resolve) => {
    window.Dropbox.save(fileUrl, filename, {
      success: () => resolve(),
      cancel: () => resolve(),
      error: (errorMessage: string) => {
        console.error('Dropbox save failed:', errorMessage);
        resolve();
      },
    });
  });
}
