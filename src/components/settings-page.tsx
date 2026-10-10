import { useState } from "react"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { CheckIcon, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const settingsTabs = [
  { value: "download", label: "下载设置" },
  { value: "general", label: "基本设置" },
  { value: "emby", label: "Emby 看板" },
  { value: "exclusions", label: "全局排除" },
  { value: "proxy", label: "代理" },
  { value: "security", label: "安全" },
  { value: "notifications", label: "通知" },
  { value: "donate", label: "捐赠" },
  { value: "about", label: "关于" },
]

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
      <FieldLabel htmlFor={id} className="!flex-none !w-28 pt-2">
        {label}
      </FieldLabel>
      <FieldContent className="max-w-3xl">
        {children}
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
    </Field>
  )
}

function SettingsSelect({
  id,
  label,
  value,
  options,
  description,
}: {
  id: string
  label: string
  value: string
  options: string[]
  description?: string
}) {
  const items = options.map((option) => ({ label: option, value: option }))

  return (
    <SettingField id={id} label={label} description={description}>
      <Select items={items} defaultValue={value}>
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

function SettingsInput({
  id,
  label,
  placeholder,
  type = "text",
  description,
}: {
  id: string
  label: string
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  description?: string
}) {
  return (
    <SettingField id={id} label={label} description={description}>
      <Input
        id={id}
        name={id}
        type={type}
        autoComplete={type === "password" ? "new-password" : "off"}
        placeholder={placeholder}
      />
    </SettingField>
  )
}

function SettingsSwitch({
  id,
  label,
  description,
}: {
  id: string
  label: string
  description?: string
}) {
  return (
    <SettingField id={id} label={label} description={description}>
      <Switch id={id} />
    </SettingField>
  )
}

export function SettingsPage() {
  const [embySaved, setEmbySaved] = useState(false)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <Tabs defaultValue="download" className="w-full">
        <TabsList variant="pill" aria-label="全局设置分类" className="max-w-full overflow-x-auto">
          {settingsTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="download" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingsSelect
              id="download-tool"
              label="下载工具"
              value="OpenList"
              options={["OpenList", "115 网盘", "123 网盘"]}
            />
            <SettingsInput
              id="download-url"
              label="地址"
              placeholder="请输入下载工具地址"
            />
            <SettingsInput
              id="download-token"
              label="Token"
              type="password"
              placeholder="请输入访问令牌"
              description="请在下载工具设置中创建并填写访问令牌。"
            />
            <Alert>
              <InfoIcon />
              <AlertDescription>
                请先配置下载工具地址和 Token，再测试连接。
              </AlertDescription>
            </Alert>
            <SettingsSelect
              id="download-driver"
              label="Driver"
              value="115 网盘"
              options={["115 网盘", "123 网盘", "PikPak", "迅雷云盘"]}
            />
            <SettingsInput
              id="download-retries"
              label="重试次数"
              type="number"
              placeholder="5"
              description="设置为 -1 将一直进行重试。"
            />
            <SettingsInput
              id="download-timeout"
              label="离线超时（分钟）"
              type="number"
              placeholder="60"
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="general" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingsInput id="site-name" label="站点名称" placeholder="FRAME 媒体中心" />
            <SettingsSelect
              id="metadata-source"
              label="元数据来源"
              value="TMDB"
              options={["TMDB", "TheTVDB"]}
            />
            <SettingsSwitch
              id="auto-refresh"
              label="自动刷新媒体信息"
              description="定期检查已订阅内容的媒体信息。"
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="emby" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingsInput id="emby-server-name" label="站点名称" placeholder="主媒体库" description="用于区分看板统计来源。" />
            <SettingsInput id="emby-server-url" label="Emby 地址" placeholder="http://emby.local:8096" />
            <SettingsSwitch id="emby-auto-refresh" label="每小时自动刷新" description="启用后定期更新看板数据。" />
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="button" onClick={() => setEmbySaved(true)}>保存 Emby 设置</Button>
              {embySaved && <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><CheckIcon className="size-4" />模拟设置已保存</span>}
            </div>
          </FieldGroup>
          <Alert className="mt-5">
            <InfoIcon />
            <AlertDescription>当前为界面预览，设置仅在页面中模拟，不会连接 Emby 服务。</AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="exclusions" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingsInput
              id="excluded-paths"
              label="排除目录"
              placeholder="每行填写一个目录"
              description="匹配到的目录不会参与媒体扫描。"
            />
            <SettingsInput
              id="excluded-names"
              label="排除关键词"
              placeholder="例如：样片、预告片"
            />
            <SettingsInput
              id="excluded-extensions"
              label="排除扩展名"
              placeholder="例如：.nfo, .txt"
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="proxy" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingsSwitch id="proxy-enabled" label="启用代理" />
            <SettingsInput id="proxy-address" label="代理地址" placeholder="http://127.0.0.1:7890" />
            <SettingsInput id="proxy-bypass" label="绕过代理" placeholder="每行填写一个域名或地址" />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="security" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingsSwitch id="login-required" label="启用登录验证" />
            <SettingsInput id="session-duration" label="会话有效期（小时）" type="number" placeholder="24" />
            <SettingsSwitch
              id="secure-cookies"
              label="安全 Cookie"
              description="仅在 HTTPS 环境下传输登录 Cookie。"
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="notifications" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingsSwitch id="notifications-enabled" label="启用通知" />
            <SettingsSelect
              id="notification-channel"
              label="通知渠道"
              value="Telegram"
              options={["Telegram", "Webhook"]}
            />
            <SettingsInput id="notification-target" label="接收地址" placeholder="填写机器人或 Webhook 地址" />
          </FieldGroup>
        </TabsContent>

        <TabsContent value="donate" className="pt-5">
          <Alert>
            <InfoIcon />
            <AlertDescription>
              如果这个项目对你有帮助，可以通过捐赠支持后续开发。
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="about" className="pt-5">
          <FieldGroup className="gap-4">
            <SettingsInput id="app-name" label="应用名称" placeholder="FRAME 媒体中心" />
            <SettingsInput id="app-version" label="版本" placeholder="开发中" />
          </FieldGroup>
        </TabsContent>
      </Tabs>
      <p className="text-sm text-muted-foreground">
        当前为界面预览，配置保存与后端尚未接入。
      </p>
    </div>
  )
}
