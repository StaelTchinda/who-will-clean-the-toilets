import { expect, type Page } from "@playwright/test";
import { pickAnswerId, questionsFor, type AnswerStrategy } from "./questions";

type Kids = "Oui" | "Peut-être" | "Non";

/**
 * TanStack Start SSRs the home page, so `Démarrer un questionnaire` is in the
 * DOM (and clickable to Playwright) before React has hydrated and attached
 * its onClick handler. Clicking too early is a no-op — `mode` stays `intro`
 * and the form never renders. We resolve this by waiting for `networkidle`:
 * the Vite client loads the route chunk over HTTP, and once those requests
 * settle, hydration is complete. (HMR uses a websocket which networkidle
 * ignores, so the wait does terminate.)
 */
async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/**
 * Drive the home page through CreateForm and into the WaitingForJoin stage.
 * Returns the 4-char session code parsed from the URL.
 *
 * Selectors prefer roles + visible French copy because the home page has both
 * a CreateForm and a JoinForm definition in the source — but only one renders
 * at a time, so there's no scoping conflict.
 */
export async function createSessionUI(
  page: Page,
  opts: { name: string; kids: Kids },
): Promise<string> {
  await gotoHydrated(page, "/");
  // Two CTAs at the top + one at the bottom; either entry path works, but
  // .first() makes the intent explicit.
  await page.getByRole("button", { name: "Démarrer un questionnaire" }).first().click();
  await page.getByLabel("Ton prénom").fill(opts.name);
  await page.getByRole("button", { name: opts.kids, exact: true }).click();
  await page.getByRole("button", { name: "Créer le questionnaire" }).click();
  await page.waitForURL(/\/s\/[A-Z0-9]{4}$/);
  const match = page.url().match(/\/s\/([A-Z0-9]{4})$/);
  if (!match) throw new Error(`Expected session code in URL, got ${page.url()}`);
  return match[1];
}

export async function joinSessionUI(
  page: Page,
  opts: { code: string; name: string; kids: Kids },
): Promise<void> {
  await gotoHydrated(page, "/");
  await page.getByRole("button", { name: "Rejoindre avec un code" }).click();
  await page.getByLabel("Code de session").fill(opts.code);
  await page.getByLabel("Ton prénom").fill(opts.name);
  await page.getByRole("button", { name: opts.kids, exact: true }).click();
  await page.getByRole("button", { name: "Rejoindre" }).click();
  await page.waitForURL(/\/s\/[A-Z0-9]{4}$/);
}

/**
 * Step through all questions for one partner. Drives the questionnaire by
 * the deterministic index (not by reading the live counter) and retries the
 * click if the counter fails to advance — which happens when a click lands
 * during SwipeStage's commit window:
 *
 *   SwipeStage.commit: setLocked(true) → preview flash ~220ms →
 *     await onPick → parent setIndex → re-render → useEffect resets locked.
 *
 * Between "parent counter updated" and "child stage useEffect runs", the new
 * card's buttons are visible & enabled to Playwright but the React handler
 * is still `locked`, so the click is a no-op. Polling the counter for
 * advancement gives us the only honest "ready for next click" signal the
 * app exposes. (Form mode has no lock; the retry loop becomes a no-op.)
 *
 * Returns when the partner reaches either the WaitingForFinish or the
 * ResultsView stage — both unmount the questionnaire counter.
 */
export async function answerAllQuestions(
  page: Page,
  opts: {
    partner: "a" | "b";
    includeChildren: boolean;
    strategy: AnswerStrategy;
  },
): Promise<void> {
  const questions = questionsFor(opts.includeChildren);
  const total = questions.length;

  for (let i = 0; i < total; i++) {
    const q = questions[i];
    const answerId = pickAnswerId(q, i, opts.partner, opts.strategy);
    const answer = q.answers.find((a) => a.id === answerId);
    if (!answer) throw new Error(`Bad answer id ${answerId} for ${q.id}`);

    // Wait for this question's slot — both counter index and question text.
    await expect(page.getByText(`${i + 1}/${total}`, { exact: true })).toBeVisible();
    await expect(page.getByText(q.label, { exact: true })).toBeVisible();

    const answerBtn = page.getByRole("button", { name: answer.label, exact: true }).first();

    // Click, then wait for the counter to advance. Retry up to 5 times if it
    // doesn't — covers the lock-window race + any one-off Realtime jitter.
    let advanced = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      await answerBtn.click();
      const isLast = i === total - 1;
      try {
        if (isLast) {
          // On the last question, the questionnaire unmounts entirely — we
          // land on WaitingForFinish or ResultsView. Either heading is fine.
          await expect(
            page.getByText(
              /On attend que .* finisse|Qui nettoiera les toilettes \? · résultats|Envoi de tes/,
            ),
          ).toBeVisible({ timeout: 3000 });
        } else {
          await expect(page.getByText(`${i + 2}/${total}`, { exact: true })).toBeVisible({
            timeout: 3000,
          });
        }
        advanced = true;
        break;
      } catch {
        // Counter didn't budge — the click was eaten by SwipeStage's lock.
        // Re-clicking is safe: the same button maps to the same answer.
      }
    }
    if (!advanced) {
      throw new Error(
        `Partner ${opts.partner} stuck on question ${i + 1}/${total} ` +
          `(${q.id}); answer "${answer.label}" did not advance the counter`,
      );
    }
  }
}
