import { useRef, useState, useEffect } from "react"
import { FolderIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  downloadApi,
  directoryIdFromInput,
  is115ShareURL,
  type DownloadFile,
  type DownloadMediaContext,
} from "@/lib/download-api"

export type DownloadSource = {
  url: string
  password?: string
  title: string
  media?: DownloadMediaContext
}
export function ResourceDownloadDialog({
  source,
  media,
  onClose,
  onCreated,
  initialDirectory = "",
}: {
  source: DownloadSource
  media?: DownloadMediaContext
  onClose: () => void
  onCreated: () => void
  initialDirectory?: string
}) {
  const sharing = is115ShareURL(source.url)
  const [directory, setDirectory] = useState(initialDirectory)
  const [password, setPassword] = useState(source.password ?? "")
  const [files, setFiles] = useState<DownloadFile[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [folder, setFolder] = useState("0")
  const [parents, setParents] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])

  async function browse(id: string, stack: string[]) {
    controller.current?.abort()
    const next = new AbortController()
    controller.current = next
    setBusy(true)
    setError("")
    try {
      const result = await downloadApi.shareFiles(
        source.url,
        password.trim(),
        id,
        next.signal
      )
      if (!next.signal.aborted) {
        setFiles(result.items)
        setFolder(id)
        setParents(stack)
        setSelected([])
      }
    } catch (reason) {
      if (!next.signal.aborted)
        setError(reason instanceof Error ? reason.message : "读取分享失败")
    } finally {
      if (!next.signal.aborted) setBusy(false)
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError("")
    const context = media ?? source.media
    try {
      await downloadApi.create({
        kind: sharing ? "share_transfer" : "offline",
        url: source.url,
        directoryId: directoryIdFromInput(directory),
        reference: {
          source: "media_search",
          sourceId: context?.providerId
            ? `${context.provider}:${context.type ?? "unknown"}:${context.providerId}`
            : undefined,
          media: context ?? { title: source.title },
        },
        ...(sharing
          ? {
              receiveCode: password.trim(),
              sourceDirectoryId: folder,
              fileIds: selected,
            }
          : {}),
      })
      onCreated()
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "下载提交失败")
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {sharing ? "转存 115 分享" : "提交 115 离线下载"}
          </DialogTitle>
          <DialogDescription>
            {source.title}。任务及产物可在“下载任务”中查看。
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void submit(event)}
          className="flex min-h-0 flex-col gap-4"
        >
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="resource-download-target">
                115 目标文件夹
              </FieldLabel>
              <Input
                id="resource-download-target"
                value={directory}
                onChange={(event) => setDirectory(event.target.value)}
                placeholder="粘贴包含 cid 的文件夹链接，或文件夹 ID"
                required
                disabled={busy}
              />
              <FieldDescription>
                {sharing
                  ? "分享先转存到目标内的独立任务目录，确认文件后供公共整理使用。"
                  : "下载保留原始文件名；后续由公共整理归档。"}
              </FieldDescription>
            </Field>
            {sharing && (
              <Field>
                <FieldLabel htmlFor="share-receive-code">提取码</FieldLabel>
                <Input
                  id="share-receive-code"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setFiles([])
                    setSelected([])
                    setFolder("0")
                    setParents([])
                  }}
                  maxLength={32}
                  disabled={busy}
                />
              </Field>
            )}
          </FieldGroup>
          {sharing && (
            <>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void browse("0", [])}
                  disabled={busy}
                >
                  读取分享根目录
                </Button>
                {parents.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void browse(
                        parents[parents.length - 1],
                        parents.slice(0, -1)
                      )
                    }
                    disabled={busy}
                  >
                    返回上层
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  已选择 {selected.length} 项（最多 100 项）
                </span>
              </div>
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>选择</TableHead>
                      <TableHead>文件或目录</TableHead>
                      <TableHead>大小</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <Checkbox
                            aria-label={`选择 ${file.name}`}
                            checked={selected.includes(file.id)}
                            disabled={
                              busy ||
                              (!selected.includes(file.id) &&
                                selected.length >= 100)
                            }
                            onCheckedChange={(checked) =>
                              setSelected((current) =>
                                checked
                                  ? [...current, file.id]
                                  : current.filter((id) => id !== file.id)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {file.directory ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void browse(file.id, [...parents, folder])
                              }
                            >
                              <FolderIcon data-icon="inline-start" />
                              {file.name}
                            </Button>
                          ) : (
                            file.name
                          )}
                        </TableCell>
                        <TableCell>
                          {file.directory
                            ? "目录"
                            : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!files.length && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          {busy
                            ? "正在读取…"
                            : "读取分享后，选择要转存的文件。"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={
                busy || !directory.trim() || (sharing && !selected.length)
              }
            >
              {busy ? "处理中…" : sharing ? "确认选择并转存" : "加入下载队列"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
