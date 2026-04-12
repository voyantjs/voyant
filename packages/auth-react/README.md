# @voyantjs/auth-react

React runtime package for Voyant authentication and workspace state.

This package wraps the shared Voyant auth HTTP contract:

- `/auth/me`
- `/auth/status`
- `/auth/workspace`
- `/auth/workspace/active-organization`
- `/auth/organization/list-members`
- `/auth/organization/list-invitations`
- `/auth/organization/invite-member`
- `/auth/organization/update-member-role`
- `/auth/organization/remove-member`
- `/auth/organization/cancel-invitation`

It provides reusable React surfaces for:

- current user and workspace state
- organization member listing
- organization invitation listing
- invite, cancel, remove, and role update mutations
