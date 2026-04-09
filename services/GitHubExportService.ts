/**
 * GitHubExportService
 * Exports crawl data to a GitHub repository.
 */

export async function exportToGitHub(
  githubToken: string,
  repo: string, // "owner/repo"
  data: { sessionId: string; projectName: string; content: string }
) {
  const date = new Date().toISOString().split('T')[0];
  const path = `crawl-snapshots/${data.projectName}/${date}-${data.sessionId.substring(0, 8)}.json`;
  
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Headlight crawl snapshot: ${data.projectName} (${date})`,
      content: btoa(unescape(encodeURIComponent(data.content))) // UTF-8 safe base64
    })
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'GitHub upload failed');
  }
  
  return res.json();
}
