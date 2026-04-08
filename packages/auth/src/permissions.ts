import { createAccessControl } from "better-auth/plugins/access"
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access"

export const voyantStatements = {
  ...defaultStatements,
  operator: ["create", "read", "update", "delete"],
  connection: ["create", "read", "update", "delete"],
  oauthClient: ["create", "read", "revoke"],
  apiKey: ["create", "read", "update", "delete"],
  operatorGrant: ["create", "read", "update", "delete"],
  auditLog: ["read"],
  settings: ["read", "update"],
} as const

export const ac = createAccessControl(voyantStatements)

export const roles = {
  owner: ac.newRole({
    operator: ["create", "read", "update", "delete"],
    connection: ["create", "read", "update", "delete"],
    oauthClient: ["create", "read", "revoke"],
    apiKey: ["create", "read", "update", "delete"],
    operatorGrant: ["create", "read", "update", "delete"],
    auditLog: ["read"],
    settings: ["read", "update"],
    ...ownerAc.statements,
  }),
  admin: ac.newRole({
    operator: ["create", "read", "update"],
    connection: ["create", "read", "update", "delete"],
    oauthClient: ["create", "read", "revoke"],
    apiKey: ["create", "read", "update", "delete"],
    operatorGrant: ["create", "read", "update"],
    auditLog: ["read"],
    settings: ["read"],
    ...adminAc.statements,
  }),
  member: ac.newRole({
    operator: ["read"],
    connection: ["read"],
    oauthClient: ["read"],
    apiKey: ["read"],
    operatorGrant: ["read"],
    auditLog: ["read"],
    settings: ["read"],
    ...memberAc.statements,
  }),
}
