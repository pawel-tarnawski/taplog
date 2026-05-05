import { test, expect, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

async function addActivity(page: Page, name: string) {
  await page.getByRole('button', { name: 'Add activity' }).click()
  await page.getByLabel('Activity name').fill(name)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
}

/** Inject accumulatedMs for the first activity without running the timer */
async function injectTime(page: Page, ms: number, activityIndex = 0) {
  await page.evaluate(
    ({ ms, idx }) => {
      const raw = localStorage.getItem('taplog_state')
      if (!raw) return
      const state = JSON.parse(raw) as { activities: { accumulatedMs: number }[] }
      if (state.activities[idx]) state.activities[idx].accumulatedMs = ms
      localStorage.setItem('taplog_state', JSON.stringify(state))
    },
    { ms, idx: activityIndex },
  )
  await page.reload()
}

// ─────────────────────────────────────────────────────────────────────────────

test('reset tile → undo → time restored', async ({ page }) => {
  await addActivity(page, 'Work')
  await injectTime(page, 9000) // 9 seconds

  const timer = page.locator('[aria-label^="Timer:"]').first()
  await expect(timer).toContainText('00:00:09')

  // Reset via context menu
  await page.getByRole('button', { name: 'Activity options' }).click()
  await page.getByRole('menuitem', { name: 'Reset tile' }).click()
  await expect(timer).toContainText('00:00:00')

  // Undo button should appear
  const undoBtn = page.getByRole('button', { name: 'Undo reset' }).first()
  await expect(undoBtn).toBeVisible()

  // Undo restores the time
  await undoBtn.click()
  await expect(timer).toContainText('00:00:09')

  // Undo button disappears after use
  await expect(undoBtn).not.toBeVisible()
})

test('reset all → undo → all times restored', async ({ page }) => {
  await addActivity(page, 'Work')
  await addActivity(page, 'Break')

  // Inject time into both activities
  await page.evaluate(() => {
    const raw = localStorage.getItem('taplog_state')
    if (!raw) return
    const state = JSON.parse(raw) as { activities: { accumulatedMs: number }[] }
    state.activities[0].accumulatedMs = 4000
    state.activities[1].accumulatedMs = 2000
    localStorage.setItem('taplog_state', JSON.stringify(state))
  })
  await page.reload()

  const timers = page.locator('[aria-label^="Timer:"]')
  await expect(timers.nth(0)).toContainText('00:00:04')
  await expect(timers.nth(1)).toContainText('00:00:02')

  // Reset all
  await page.getByRole('button', { name: 'Reset all' }).first().click()
  await expect(timers.nth(0)).toContainText('00:00:00')
  await expect(timers.nth(1)).toContainText('00:00:00')

  // Undo
  const undoBtn = page.getByRole('button', { name: 'Undo reset' }).first()
  await expect(undoBtn).toBeVisible()
  await undoBtn.click()

  // Both times restored
  await expect(timers.nth(0)).toContainText('00:00:04')
  await expect(timers.nth(1)).toContainText('00:00:02')
  await expect(undoBtn).not.toBeVisible()
})

test('undo button is hidden when no reset has occurred', async ({ page }) => {
  await addActivity(page, 'Work')
  await expect(page.getByRole('button', { name: 'Undo reset' })).not.toBeVisible()
})

test('undo snapshot clears on new day after reset', async ({ page }) => {
  await addActivity(page, 'Work')
  await injectTime(page, 5000)

  // Reset to create an undo snapshot
  await page.getByRole('button', { name: 'Activity options' }).click()
  await page.getByRole('menuitem', { name: 'Reset tile' }).click()

  // Now simulate a day change — undo snapshot should be wiped
  await page.evaluate(() => {
    const raw = localStorage.getItem('taplog_state')
    if (!raw) return
    const state = JSON.parse(raw) as { date: string; activities: unknown[] }
    state.date = '2000-01-01'
    localStorage.setItem('taplog_state', JSON.stringify(state))
  })
  await page.reload()

  // Undo button must not appear (snapshot was cleared with day change)
  await expect(page.getByRole('button', { name: 'Undo reset' })).not.toBeVisible()
})
