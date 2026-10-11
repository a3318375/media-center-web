import { getAccessToken } from "@/lib/auth-api"

export type SettingValue = string | boolean | number
export type SettingsSection = "emby" | "115" | "organize" | "search" | "notifications"

type SettingsResponse = {
  values: Record<string, SettingValue>
  configuredSecrets: string[]
}

async function request(section: SettingsSection, method: "GET" | "PUT", body?: unknown) {
  const token = getAccessToken()
  const response = await fetch(`/api/settings/${encodeURIComponent(section)}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "配置请求失败")
  }
  return response.json() as Promise<SettingsResponse>
}

export const settingsApi = {
  get(section: SettingsSection) { return request(section, "GET") },
  save(section: SettingsSection, values: Record<string, SettingValue>) {
    return request(section, "PUT", { values })
  },
}
