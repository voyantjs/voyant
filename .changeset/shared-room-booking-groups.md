---
"@voyantjs/bookings": minor
"@voyantjs/bookings-react": minor
"@voyantjs/db": patch
---

Add a shared-room / split-booking group model

Multiple separate bookings can now intentionally share one room/accommodation while each booking keeps its own finance + traveler records. Inspired by the ProTravel v3 `sharing_groups` pattern: flat peer bookings, a lightweight `booking_groups` + `booking_group_members` schema, smart cleanup on cancellation.

`@voyantjs/bookings`: new `bookingGroups` and `bookingGroupMembers` tables (TypeID prefixes `bkgr` / `bkgm`), service functions for CRUD plus reverse lookup, unified passenger list across members, and automatic group dissolution when a cancellation leaves ≤1 active members. New routes under `/v1/bookings/groups` plus the REST-nested `GET /v1/bookings/:id/group`.

`@voyantjs/bookings-react`: hooks for `useBookingGroups`, `useBookingGroup`, `useBookingGroupForBooking`, `useBookingGroupMutation`, and `useBookingGroupMemberMutation` (stateless — accepts `groupId` per-call so create-then-add flows work with a single hook instance).

`@voyantjs/db`: register TypeID prefixes `bkgr` (booking_groups) and `bkgm` (booking_group_members).
