function withStatus(status: number, init?: ResponseInit): ResponseInit {
  return { ...init, status }
}

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init)
}

export function created(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, withStatus(201, init))
}

export function noContent(init?: ResponseInit): Response {
  return new Response(null, withStatus(204, init))
}

export function badRequest(
  body: unknown = { error: "Bad Request" },
  init?: ResponseInit,
): Response {
  return Response.json(body, withStatus(400, init))
}

export function unauthorized(
  body: unknown = { error: "Unauthorized" },
  init?: ResponseInit,
): Response {
  return Response.json(body, withStatus(401, init))
}

export function forbidden(body: unknown = { error: "Forbidden" }, init?: ResponseInit): Response {
  return Response.json(body, withStatus(403, init))
}

export function notFound(body: unknown = { error: "Not Found" }, init?: ResponseInit): Response {
  return Response.json(body, withStatus(404, init))
}

export function serverError(
  body: unknown = { error: "Internal Server Error" },
  init?: ResponseInit,
): Response {
  return Response.json(body, withStatus(500, init))
}
