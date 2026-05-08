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

// ─────────────────────────────────────────────────────────────────────────────

test('app loads and shows Add activity button', async ({ page }) => {
  await expect(page).toHaveTitle(/Taplog/)
  await expect(page.getByRole('button', { name: 'Add activity' })).toBeVisible()
})

test('start timer → pause → reload → time persists', async ({ page }) => {
  await addActivity(page, 'Work')

  await page.getByRole('button', { name: 'Start tracking Work' }).click()
  await expect(page.getByRole('button', { name: 'Stop tracking Work' })).toBeVisible()

  // Let at least 1 second of real time elapse
  await page.waitForTimeout(2000)

  await page.getByRole('button', { name: 'Stop tracking Work' }).click()

  const timerLocator = page.locator('[aria-label^="Timer:"]').first()
  const timeBefore = await timerLocator.textContent()
  expect(timeBefore).not.toBe('00:00:00')

  await page.reload()

  expect(await timerLocator.textContent()).toBe(timeBefore)
})

test('running timer survives reload', async ({ page }) => {
  await addActivity(page, 'Work')
  await page.getByRole('button', { name: 'Start tracking Work' }).click()
  await page.waitForTimeout(1500)
  await page.reload()

  await expect(page.getByRole('button', { name: 'Stop tracking Work' })).toBeVisible()
  await expect(page.locator('[aria-label^="Timer:"]').first()).not.toContainText('00:00:00')
})

test('add 5 tiles → grid reflows without overflow', async ({ page }) => {
  const names = ['Work', 'Study', 'Exercise', 'Break', 'Reading']
  for (const name of names) {
    await addActivity(page, name)
  }

  for (const name of names) {
    await expect(page.getByRole('button', { name: new RegExp(`tracking ${name}`, 'i') })).toBeVisible()
  }

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('toggle button meets ≥ 44×44 px tap target', async ({ page }) => {
  await addActivity(page, 'Work')
  const box = await page.getByRole('button', { name: 'Start tracking Work' }).boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test('options button meets ≥ 44×44 px tap target', async ({ page }) => {
  await addActivity(page, 'Work')
  const box = await page.getByRole('button', { name: 'Activity options' }).boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test('day-change resets times but keeps activity names', async ({ page }) => {
  await addActivity(page, 'Work')

  // Inject accumulated time then backdate the stored date
  await page.evaluate(() => {
    const raw = localStorage.getItem('taplog_state')
    if (!raw) return
    const state = JSON.parse(raw) as { date: string; activities: { accumulatedMs: number }[] }
    state.activities[0].accumulatedMs = 5000
    state.date = '2000-01-01'
    localStorage.setItem('taplog_state', JSON.stringify(state))
  })

  await page.reload()

  // Name must survive
  await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible()
  // Time must be zeroed out
  await expect(page.locator('[aria-label^="Timer:"]').first()).toContainText('00:00:00')
})

test('rename activity via ⋯ menu', async ({ page }) => {
  await addActivity(page, 'Work')
  await page.getByRole('button', { name: 'Activity options' }).click()
  await page.getByRole('menuitem', { name: 'Rename' }).click()

  const input = page.getByLabel('Activity name')
  await expect(input).toBeVisible()
  await input.fill('Deep Work')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { name: 'Deep Work' })).toBeVisible()
})

test('delete activity via context menu', async ({ page }) => {
  await addActivity(page, 'Work')
  await page.getByRole('button', { name: 'Activity options' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()

  await expect(page.getByRole('heading', { name: 'Work' })).not.toBeVisible()
})
