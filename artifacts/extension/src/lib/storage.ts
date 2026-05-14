export interface ExtensionSettings {
  apiUrl: string;
  autoScore: boolean;
  showNotifications: boolean;
  defaultPipelineStage: string;
}

const DEFAULTS: ExtensionSettings = {
  apiUrl: "https://op-job-hub.vercel.app/api",
  autoScore: true,
  showNotifications: true,
  defaultPipelineStage: "sourced",
};

export async function getSettings(): Promise<ExtensionSettings> {
  const data = await chrome.storage.sync.get("settings");
  return { ...DEFAULTS, ...(data.settings || {}) };
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.sync.set({ settings: { ...current, ...settings } });
}

export async function getToken(): Promise<string | null> {
  const data = await chrome.storage.local.get("token");
  return data.token || null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ token });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove("token");
}
