/**
 * GoogleDriveExportService
 * Exports crawl data to Google Drive.
 */

async function ensureFolderExists(accessToken: string, folderName: string): Promise<string> {
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  if (!searchRes.ok) {
    const err = await searchRes.json();
    console.error('[GoogleDrive] Folder search failed:', err);
    throw new Error('Failed to access Google Drive folders');
  }

  const { files } = await searchRes.json();
  
  if (files && files.length > 0) {
    return files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['root']
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    console.error('[GoogleDrive] Folder creation failed:', err);
    throw new Error('Failed to create Headlight Backups folder');
  }

  const folder = await createRes.json();
  return folder.id;
}

export async function exportToGoogleDrive(
  accessToken: string,
  data: { sessionId: string; projectName: string; content: string }
) {
  // 1. Ensure backup folder exists
  const folderId = await ensureFolderExists(accessToken, 'Headlight Backups');

  // 2. Prepare file metadata
  const metadata = {
    name: `Headlight-Crawl-${data.projectName.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    mimeType: 'application/json',
    parents: [folderId]
  };
  
  const boundary = 'headlight_boundary';
  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${data.content}\r\n`,
    `--${boundary}--`
  ].join('');
  
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Google Drive upload failed');
  }
  
  return res.json();
}
