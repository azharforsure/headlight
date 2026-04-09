/**
 * GoogleDriveExportService
 * Exports crawl data to Google Drive.
 */

export async function exportToGoogleDrive(
  accessToken: string,
  data: { sessionId: string; projectName: string; content: string }
) {
  const metadata = {
    name: `Headlight-Crawl-${data.projectName}-${new Date().toISOString().split('T')[0]}.json`,
    mimeType: 'application/json',
    parents: ['root']
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
