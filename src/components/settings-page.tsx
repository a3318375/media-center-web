import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckIcon, InfoIcon, SaveIcon, ShieldCheckIcon } from "lucide-react"
import { changePassword, getCurrentUser, updateAccount } from "@/lib/auth-api"
import {
  settingsApi,
  type SettingsSection,
  type SettingValue as ApiSettingValue,
} from "@/lib/settings-api"
import { APIKeysPanel } from "@/components/api-keys-panel"

type SettingValue = string | boolean | number
type Section =
  | "tmdb"
  | "emby"
  | "115"
  | "organize"
  | "search"
  | "account"
  | "notifications"
  | "api-keys"

const tabs: { value: Section; label: string }[] = [
  { value: "tmdb", label: "TMDB" },
  { value: "emby", label: "Emby" },
  { value: "115", label: "115 网盘" },
  { value: "organize", label: "媒体整理" },
  { value: "search", label: "搜索规则" },
  { value: "account", label: "账号与安全" },
  { value: "api-keys", label: "API 密钥" },
  { value: "notifications", label: "通知与机器人" },
]

const defaults: Record<string, SettingValue> = {
  "emby.url": "",
  "emby.apiKey": "",
  "emby.cacheExpirationHours": 12,
  "115.cookie": "",
  "115.downloadDirectory": "",
  "organize.enabled": true,
  "organize.sourcePaths": "",
  "organize.moviePath": "",
  "organize.tvPath": "",
  "organize.movieFormat": "{title} ({year})/{title} ({year})",
  "organize.tvFormat":
    "{title} ({year})/Season {season}/{title} - S{season}E{episode}",
  "organize.moveMode": "硬链接，失败时复制",
  "organize.skipExisting": true,
  "search.tmdb": true,
  "search.douban": true,
  "search.bangumi": true,
  "search.anilist": true,
  "search.priority": "TMDB → 豆瓣 → Bangumi → AniList",
  "search.auto": true,
  "search.interval": "24",
  "search.minSeeders": "2",
  "search.quality": "优先 1080p，允许 2160p",
  "search.excludeKeywords": "预告, 花絮, 样片, 宣传片",
  "account.name": "admin",
  "account.currentPassword": "",
  "account.newPassword": "",
  "account.confirmPassword": "",
  "notifications.telegramEnabled": false,
  "notifications.botToken": "",
  "notifications.chatId": "",
  "notifications.receiveEnabled": false,
  "notifications.receiveMode": "长轮询",
  "notifications.webhookUrl": "",
  "notifications.notifyOnComplete": true,
  "notifications.notifyOnError": true,
}

function SettingField({
  id,
  label,
  description,
  children,
}: {
  id: string
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Field orientation="horizontal" className="items-start">
      <FieldLabel htmlFor={id} className="!w-28 !flex-none pt-2">
        {label}
      </FieldLabel>
      <FieldContent className="max-w-3xl">
        {children}
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
    </Field>
  )
}

function SettingInput({
  id,
  label,
  description,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  id: string
  label: string
  description?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <SettingField id={id} label={label} description={description}>
      <Input
        id={id}
        name={id}
        type={type}
        autoComplete={type === "password" ? "new-password" : "off"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </SettingField>
  )
}

function SettingTextarea({
  id,
  label,
  description,
  placeholder,
  value,
  onChange,
}: {
  id: string
  label: string
  description?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <SettingField id={id} label={label} description={description}>
      <Textarea
        id={id}
        name={id}
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </SettingField>
  )
}

function SettingSelect({
  id,
  label,
  description,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  description?: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  const items = options.map((option) => ({ label: option, value: option }))

  return (
    <SettingField id={id} label={label} description={description}>
      <Select
        items={items}
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) onChange(nextValue)
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </SettingField>
  )
}

function SettingSwitch({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <SettingField id={id} label={label} description={description}>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </SettingField>
  )
}

function SectionSave({
  section,
  saved,
  onSave,
}: {
  section: Section
  saved: boolean
  onSave: (section: Section) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <Button type="button" onClick={() => onSave(section)}>
        <SaveIcon data-icon="inline-start" />
        保存本页设置
      </Button>
      {saved && (
        <span
          role="status"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <CheckIcon data-icon="inline-start" />
          已保存
        </span>
      )}
    </div>
  )
}

export function SettingsPage() {
  const [values, setValues] = useState<Record<string, SettingValue>>({
    ...defaults,
  })
  const [savedSections, setSavedSections] = useState<Section[]>([])
  const [configuredSecrets, setConfiguredSecrets] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [initialAccount, setInitialAccount] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    let active = true
    const sections = tabs
      .map((tab) => tab.value)
      .filter(
        (section): section is SettingsSection =>
          section !== "account" && section !== "api-keys"
      )
    Promise.all([
      Promise.all(
        sections.map(async (section) => ({
          section,
          result: await settingsApi.get(section),
        }))
      ),
      getCurrentUser(),
    ])
      .then(([results, user]) => {
        if (!active) return
        const persistedValues = Object.assign(
          {},
          ...results.map(({ result }) => result.values)
        )
        const supportedValues = Object.fromEntries(
          Object.entries(persistedValues).filter(([key]) => key in defaults)
        )
        setValues((current) => ({
          ...current,
          ...supportedValues,
          "account.name": user.account,
        }))
        setInitialAccount(user.account)
        setConfiguredSecrets(
          results.flatMap(({ result }) => result.configuredSecrets)
        )
      })
      .catch((error) => {
        if (active)
          setNotice(
            error instanceof Error ? error.message : "读取服务端配置失败"
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function update(key: string, value: SettingValue) {
    setValues((current) => ({ ...current, [key]: value }))
    setSavedSections((current) =>
      current.filter((section) => !key.startsWith(`${section}.`))
    )
    setNotice("")
  }

  async function save(section: Section) {
    if (
      section === "account" &&
      values["account.newPassword"] !== values["account.confirmPassword"]
    ) {
      setNotice("两次输入的新密码不一致，请检查后再保存。")
      return
    }

    try {
      if (section === "account") {
        const account = stringValue("account.name").trim()
        const currentPassword = stringValue("account.currentPassword")
        const accountChanged = account !== initialAccount
        const passwordChanged = Boolean(stringValue("account.newPassword"))
        if ((accountChanged || passwordChanged) && !currentPassword)
          throw new Error("请先输入当前密码验证身份")
        if (accountChanged) await updateAccount(account, currentPassword)
        if (stringValue("account.newPassword"))
          await changePassword(
            currentPassword,
            stringValue("account.newPassword")
          )
        const user = await getCurrentUser()
        setValues((current) => ({
          ...current,
          "account.name": user.account,
          "account.currentPassword": "",
          "account.newPassword": "",
          "account.confirmPassword": "",
        }))
        setInitialAccount(user.account)
        setNotice("账号安全信息已保存；其他登录会话已失效。")
      } else {
        const sectionValues = Object.fromEntries(
          Object.entries(values).filter(([key]) =>
            key.startsWith(`${section}.`)
          )
        ) as Record<string, ApiSettingValue>
        const result = await settingsApi.save(
          section as SettingsSection,
          sectionValues
        )
        setValues((current) => ({
          ...current,
          ...result.values,
          ...Object.fromEntries(
            result.configuredSecrets.map((key) => [key, ""])
          ),
        }))
        setConfiguredSecrets((current) => [
          ...new Set([...current, ...result.configuredSecrets]),
        ])
        setNotice("本页配置已安全保存到服务端。")
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "保存失败，请重试。")
      return
    }
    setSavedSections((current) =>
      current.includes(section) ? current : [...current, section]
    )
  }

  const stringValue = (key: string) => String(values[key] ?? "")
  const boolValue = (key: string) => Boolean(values[key])

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">全局设置</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            管理媒体服务、网盘、整理和自动搜索。每个分类单独保存。
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 font-normal">
          <ShieldCheckIcon data-icon="inline-start" />
          单用户模式
        </Badge>
      </header>

      <Alert>
        <InfoIcon />
        <AlertDescription>
          设置会保存在服务端 SQLite 数据库。API Key、115 Cookie
          和机器人令牌在数据库中加密，读取页面时不会把密钥明文返回。
        </AlertDescription>
      </Alert>

      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          正在读取服务端配置…
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}

      <Tabs defaultValue="emby" className="w-full">
        <TabsList
          variant="pill"
          aria-label="全局设置分类"
          className="max-w-full overflow-x-auto"
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="tmdb" className="pt-5"><FieldGroup><SettingInput id="tmdb-api-key" label="TMDB API Key" type="password" value={stringValue("tmdb.apiKey")} onChange={(value) => update("tmdb.apiKey", value)} placeholder={configuredSecrets.includes("tmdb.apiKey") ? "已保存；输入新值可替换" : "输入 TMDB API Key"} description="服务端加密保存；留空保留现有密钥。" /><SectionSave section="tmdb" saved={savedSections.includes("tmdb")} onSave={save} /></FieldGroup></TabsContent>

        <TabsContent value="emby" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingInput
              id="emby-url"
              label="Emby 地址"
              placeholder="http://emby.local:8096"
              value={stringValue("emby.url")}
              onChange={(value) => update("emby.url", value)}
              description="填写服务器根地址，包含协议和端口。"
            />
            <SettingInput
              id="emby-api-key"
              label="API Key"
              type="password"
              placeholder={
                configuredSecrets.includes("emby.apiKey")
                  ? "已保存；输入新值可替换"
                  : "输入 Emby API Key"
              }
              value={stringValue("emby.apiKey")}
              onChange={(value) => update("emby.apiKey", value)}
              description="在 Emby 控制台的 API 密钥页面创建。保存后由服务端加密保管；留空不会覆盖已保存的密钥。"
            />
            <SettingInput
              id="emby-cache-expiration-hours"
              label="缓存失效时间"
              type="number"
              value={stringValue("emby.cacheExpirationHours")}
              onChange={(value) => update("emby.cacheExpirationHours", Math.max(1, Number(value) || 1))}
              description="单位为小时，默认 12 小时。打开 Emby 看板时，缓存超过此时间才会重新读取服务器数据。"
            />
            <SectionSave
              section="emby"
              saved={savedSections.includes("emby")}
              onSave={save}
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="115" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingTextarea
              id="115-cookie"
              label="115 Cookie"
              placeholder={
                configuredSecrets.includes("115.cookie")
                  ? "已保存；粘贴新 Cookie 可替换"
                  : "粘贴 115 登录 Cookie"
              }
              value={stringValue("115.cookie")}
              onChange={(value) => update("115.cookie", value)}
              description="Cookie 等同登录凭证；由服务端加密保管，留空不会覆盖已保存值。"
            />
            <SettingInput
              id="115-download-directory"
              label="下载目录"
              placeholder="例如 /影视下载"
              value={stringValue("115.downloadDirectory")}
              onChange={(value) => update("115.downloadDirectory", value)}
              description="填写 115 网盘中的目标目录。"
            />
            <SectionSave
              section="115"
              saved={savedSections.includes("115")}
              onSave={save}
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="organize" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingSwitch
              id="organize-enabled"
              label="启用自动整理"
              description="下载完成后按媒体类型归档并规范命名。"
              checked={boolValue("organize.enabled")}
              onChange={(value) => update("organize.enabled", value)}
            />
            <SettingTextarea
              id="organize-source-paths"
              label="待整理目录"
              placeholder="每行填写一个下载目录"
              value={stringValue("organize.sourcePaths")}
              onChange={(value) => update("organize.sourcePaths", value)}
              description="可填写多个目录；请确保应用具有读写权限。"
            />
            <SettingInput
              id="organize-movie-path"
              label="电影目标目录"
              placeholder="/media/movies"
              value={stringValue("organize.moviePath")}
              onChange={(value) => update("organize.moviePath", value)}
            />
            <SettingInput
              id="organize-tv-path"
              label="剧集目标目录"
              placeholder="/media/tv"
              value={stringValue("organize.tvPath")}
              onChange={(value) => update("organize.tvPath", value)}
            />
            <SettingInput
              id="organize-movie-format"
              label="电影命名规则"
              value={stringValue("organize.movieFormat")}
              onChange={(value) => update("organize.movieFormat", value)}
              description="可用变量：{title}、{year}、{quality}。"
            />
            <SettingInput
              id="organize-tv-format"
              label="剧集命名规则"
              value={stringValue("organize.tvFormat")}
              onChange={(value) => update("organize.tvFormat", value)}
              description="可用变量：{title}、{year}、{season}、{episode}。"
            />
            <SettingSelect
              id="organize-mode"
              label="整理方式"
              value={stringValue("organize.moveMode")}
              options={["硬链接，失败时复制", "复制", "移动"]}
              onChange={(value) => update("organize.moveMode", value)}
              description="硬链接适合下载目录和媒体库位于同一文件系统的情况。"
            />
            <SettingSwitch
              id="organize-skip-existing"
              label="跳过已存在文件"
              checked={boolValue("organize.skipExisting")}
              onChange={(value) => update("organize.skipExisting", value)}
            />
            <SectionSave
              section="organize"
              saved={savedSections.includes("organize")}
              onSave={save}
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="search" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingSwitch
              id="search-tmdb"
              label="TMDB 元数据"
              description="用于电影和剧集识别、筛选与匹配。"
              checked={boolValue("search.tmdb")}
              onChange={(value) => update("search.tmdb", value)}
            />
            <SettingSwitch
              id="search-douban"
              label="豆瓣"
              description="用于华语影视条目与标签补充。"
              checked={boolValue("search.douban")}
              onChange={(value) => update("search.douban", value)}
            />
            <SettingSwitch
              id="search-bangumi"
              label="Bangumi"
              description="用于动画条目和番剧信息匹配。"
              checked={boolValue("search.bangumi")}
              onChange={(value) => update("search.bangumi", value)}
            />
            <SettingSwitch
              id="search-anilist"
              label="AniList"
              description="用于动画检索和英文标题别名补充。"
              checked={boolValue("search.anilist")}
              onChange={(value) => update("search.anilist", value)}
            />
            <SettingInput
              id="search-priority"
              label="来源优先级"
              value={stringValue("search.priority")}
              onChange={(value) => update("search.priority", value)}
              description="识别失败时按顺序回退；来源名称使用逗号或箭头分隔。"
            />
            <SettingSwitch
              id="search-auto"
              label="自动搜索订阅"
              description="按订阅状态周期性搜索可用资源。"
              checked={boolValue("search.auto")}
              onChange={(value) => update("search.auto", value)}
            />
            <SettingInput
              id="search-interval"
              label="搜索间隔（小时）"
              type="number"
              value={stringValue("search.interval")}
              onChange={(value) => update("search.interval", value)}
            />
            <SettingInput
              id="search-min-seeders"
              label="最少做种数"
              type="number"
              value={stringValue("search.minSeeders")}
              onChange={(value) => update("search.minSeeders", value)}
            />
            <SettingSelect
              id="search-quality"
              label="画质偏好"
              value={stringValue("search.quality")}
              options={[
                "优先 1080p，允许 2160p",
                "优先 2160p",
                "优先 1080p",
                "不限制",
              ]}
              onChange={(value) => update("search.quality", value)}
            />
            <SettingTextarea
              id="search-exclude-keywords"
              label="排除关键词"
              placeholder="每行或用逗号填写关键词"
              value={stringValue("search.excludeKeywords")}
              onChange={(value) => update("search.excludeKeywords", value)}
              description="匹配到这些词的资源会被过滤，例如预告片、样片。"
            />
            <SectionSave
              section="search"
              saved={savedSections.includes("search")}
              onSave={save}
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="account" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingInput
              id="account-name"
              label="登录账号"
              value={stringValue("account.name")}
              onChange={(value) => update("account.name", value)}
            />
            <SettingInput
              id="account-current-password"
              label="当前密码"
              type="password"
              placeholder="验证身份"
              value={stringValue("account.currentPassword")}
              onChange={(value) => update("account.currentPassword", value)}
            />
            <SettingInput
              id="account-new-password"
              label="新密码"
              type="password"
              placeholder="设置新密码"
              value={stringValue("account.newPassword")}
              onChange={(value) => update("account.newPassword", value)}
            />
            <SettingInput
              id="account-confirm-password"
              label="确认新密码"
              type="password"
              placeholder="再次输入新密码"
              value={stringValue("account.confirmPassword")}
              onChange={(value) => update("account.confirmPassword", value)}
            />
            <SectionSave
              section="account"
              saved={savedSections.includes("account")}
              onSave={save}
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="api-keys">
          <APIKeysPanel />
        </TabsContent>

        <TabsContent value="notifications" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingSwitch
              id="notifications-telegram-enabled"
              label="启用 Telegram 通知"
              checked={boolValue("notifications.telegramEnabled")}
              onChange={(value) =>
                update("notifications.telegramEnabled", value)
              }
            />
            <SettingInput
              id="notifications-bot-token"
              label="Bot Token"
              type="password"
              placeholder={
                configuredSecrets.includes("notifications.botToken")
                  ? "已保存；输入新 Token 可替换"
                  : "从 BotFather 获取"
              }
              value={stringValue("notifications.botToken")}
              onChange={(value) => update("notifications.botToken", value)}
              description="由服务端加密保管并调用 Telegram Bot API；留空不会覆盖已保存值。"
            />
            <SettingInput
              id="notifications-chat-id"
              label="Chat ID"
              placeholder="个人、群组或频道 ID"
              value={stringValue("notifications.chatId")}
              onChange={(value) => update("notifications.chatId", value)}
            />
            <SettingSwitch
              id="notifications-receive-enabled"
              label="接收机器人消息"
              description="启用后机器人可接收命令或链接；需要后端配置长轮询或 Webhook。"
              checked={boolValue("notifications.receiveEnabled")}
              onChange={(value) =>
                update("notifications.receiveEnabled", value)
              }
            />
            <SettingSelect
              id="notifications-receive-mode"
              label="接收方式"
              value={stringValue("notifications.receiveMode")}
              options={["长轮询", "Webhook"]}
              onChange={(value) => update("notifications.receiveMode", value)}
              description="长轮询无需公网回调地址；Webhook 适合已有 HTTPS 域名的部署。"
            />
            <SettingInput
              id="notifications-webhook-url"
              label="Webhook 地址"
              placeholder="https://example.com/api/telegram/webhook"
              value={stringValue("notifications.webhookUrl")}
              onChange={(value) => update("notifications.webhookUrl", value)}
            />
            <SettingSwitch
              id="notifications-complete"
              label="任务完成时通知"
              checked={boolValue("notifications.notifyOnComplete")}
              onChange={(value) =>
                update("notifications.notifyOnComplete", value)
              }
            />
            <SettingSwitch
              id="notifications-error"
              label="任务失败时通知"
              checked={boolValue("notifications.notifyOnError")}
              onChange={(value) => update("notifications.notifyOnError", value)}
            />
            <SectionSave
              section="notifications"
              saved={savedSections.includes("notifications")}
              onSave={save}
            />
          </FieldGroup>
        </TabsContent>
      </Tabs>
    </div>
  )
}
