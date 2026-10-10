import { http, HttpResponse } from "msw"

import type { AuthUser } from "@/lib/auth-api"

const DEMO_ACCOUNT = "admin"
const DEMO_PASSWORD = "123456"
const DEMO_TOKEN = "frame-demo-access-token"

const demoUser: AuthUser = {
  id: "user-1",
  account: DEMO_ACCOUNT,
  name: "媒体管理员",
  email: "admin@frame.local",
  avatar: "",
}

function hasDemoToken(request: Request) {
  return request.headers.get("Authorization") === `Bearer ${DEMO_TOKEN}`
}

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as
      | { account?: string; password?: string }
      | null

    if (body?.account !== DEMO_ACCOUNT || body.password !== DEMO_PASSWORD) {
      return HttpResponse.json(
        { message: "账号或密码不正确。" },
        { status: 401 }
      )
    }

    return HttpResponse.json({ accessToken: DEMO_TOKEN, user: demoUser })
  }),

  http.get("/api/auth/me", ({ request }) => {
    if (!hasDemoToken(request)) {
      return HttpResponse.json(
        { message: "当前未登录。" },
        { status: 401 }
      )
    }

    return HttpResponse.json(demoUser)
  }),

  http.post("/api/auth/logout", ({ request }) => {
    if (!hasDemoToken(request)) {
      return HttpResponse.json(
        { message: "当前未登录。" },
        { status: 401 }
      )
    }

    return new HttpResponse(null, { status: 204 })
  }),
]
