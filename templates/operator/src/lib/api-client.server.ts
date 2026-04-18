import { getRequestHeaders } from "@tanstack/react-start/server"

export function getServerCookieHeader(): string | undefined {
  return getRequestHeaders().get("cookie") ?? undefined
}
