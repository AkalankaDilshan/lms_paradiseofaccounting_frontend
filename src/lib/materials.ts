import { apiClient } from '../api/client';

/**
 * Open a study material in a new tab. The materials bucket is private, so the
 * file is reached through a short-lived link from GET /materials/{id}/download
 * (which also checks the student's group). The tab is opened synchronously
 * inside the click so popup blockers allow it, then pointed at the link.
 */
export async function openMaterial(materialId: string): Promise<void> {
  const tab = window.open('', '_blank');
  if (tab) tab.opener = null;
  try {
    const { data } = await apiClient.get(`/materials/${materialId}/download`);
    if (tab) tab.location.href = data.url;
    else window.location.href = data.url;
  } catch (err) {
    tab?.close();
    throw err;
  }
}
