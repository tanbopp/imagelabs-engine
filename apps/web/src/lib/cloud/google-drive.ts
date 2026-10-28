// Google Drive GIS & Picker client loader
declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

let gapiLoaded = false;
let gisLoaded = false;
let accessToken: string | null = null;

export async function loadGoogleScripts(): Promise<void> {
  const loadGapi = new Promise<void>((resolve) => {
    if (gapiLoaded) return resolve();
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('picker', () => {
        gapiLoaded = true;
        resolve();
      });
    };
    document.body.appendChild(script);
  });

  const loadGis = new Promise<void>((resolve) => {
    if (gisLoaded) return resolve();
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    document.body.appendChild(script);
  });

  await Promise.all([loadGapi, loadGis]);
}

export async function requestGoogleAccessToken(): Promise<string> {
  if (accessToken) return accessToken;

  await loadGoogleScripts();

  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 'dummy-google-client-id';

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          accessToken = response.access_token;
          resolve(response.access_token);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export interface GoogleDriveFileResult {
  id: string;
  name: string;
  mimeType: string;
  blob: Blob;
}

export async function openGooglePicker(): Promise<GoogleDriveFileResult[]> {
  const token = await requestGoogleAccessToken();
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';

  return new Promise((resolve, reject) => {
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId((import.meta as any).env?.VITE_GOOGLE_APP_ID || '')
      .setOAuthToken(token)
      .addView(view)
      .setDeveloperKey(apiKey)
      .setCallback(async (data: any) => {
        if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
          const docs = data[window.google.picker.Response.DOCUMENTS];
          const results: GoogleDriveFileResult[] = [];

          for (const doc of docs) {
            const fileId = doc[window.google.picker.Document.ID];
            const name = doc[window.google.picker.Document.NAME];
            const mimeType = doc[window.google.picker.Document.MIME_TYPE];

            try {
              const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              const blob = await res.blob();
              results.push({ id: fileId, name, mimeType, blob });
            } catch (err) {
              console.error(`Failed to download Google Drive file ${name}:`, err);
            }
          }

          resolve(results);
        } else if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.CANCEL) {
          resolve([]);
        }
      })
      .build();

    picker.setVisible(true);
  });
}

export async function exportToGoogleDrive(fileBlob: Blob, filename: string): Promise<boolean> {
  const token = await requestGoogleAccessToken();

  const metadata = {
    name: filename,
    mimeType: fileBlob.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  return res.ok;
}
