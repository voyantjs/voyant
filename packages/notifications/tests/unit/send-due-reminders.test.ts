import { beforeEach, describe, expect, it, vi } from "vitest"

const buildNotificationTaskRuntimeMock = vi.fn()
const createNotificationServiceMock = vi.fn()
const runDueRemindersMock = vi.fn()

vi.mock("../../src/task-runtime.js", () => ({
  buildNotificationTaskRuntime: buildNotificationTaskRuntimeMock,
}))

vi.mock("../../src/service.js", () => ({
  createNotificationService: createNotificationServiceMock,
  notificationsService: {
    runDueReminders: runDueRemindersMock,
  },
}))

describe("sendDueNotificationReminders", () => {
  beforeEach(() => {
    buildNotificationTaskRuntimeMock.mockReset()
    createNotificationServiceMock.mockReset()
    runDueRemindersMock.mockReset()
  })

  it("skips the sweep when an execution lock is not acquired", async () => {
    const reminderSweepLockManager = {
      runExclusive: vi.fn(async () => ({ executed: false })),
    }

    buildNotificationTaskRuntimeMock.mockReturnValue({
      providers: [],
      reminderSweepLockManager,
    })
    createNotificationServiceMock.mockReturnValue({ send: vi.fn() })

    const { sendDueNotificationReminders } = await import("../../src/tasks/send-due-reminders.js")

    await expect(sendDueNotificationReminders({} as never, {}, { now: null })).resolves.toEqual({
      processed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    })

    expect(runDueRemindersMock).not.toHaveBeenCalled()
    expect(reminderSweepLockManager.runExclusive).toHaveBeenCalledOnce()
  })

  it("runs the sweep inside the lock when acquired", async () => {
    const reminderSweepLockManager = {
      runExclusive: vi.fn(async (_key: string, task: () => Promise<unknown>) => ({
        executed: true as const,
        value: await task(),
      })),
    }

    buildNotificationTaskRuntimeMock.mockReturnValue({
      providers: [],
      reminderSweepLockManager,
    })
    createNotificationServiceMock.mockReturnValue({ send: vi.fn() })
    runDueRemindersMock.mockResolvedValue({
      processed: 2,
      sent: 1,
      skipped: 1,
      failed: 0,
    })

    const { sendDueNotificationReminders } = await import("../../src/tasks/send-due-reminders.js")

    await expect(sendDueNotificationReminders({} as never, {}, { now: null })).resolves.toEqual({
      processed: 2,
      sent: 1,
      skipped: 1,
      failed: 0,
    })

    expect(runDueRemindersMock).toHaveBeenCalledOnce()
    expect(reminderSweepLockManager.runExclusive).toHaveBeenCalledWith(
      "notifications:due-reminders",
      expect.any(Function),
    )
  })
})
