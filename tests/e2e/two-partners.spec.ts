import type { BrowserContext } from "@playwright/test";
import { test, expect } from "./helpers/coverage";
import { countAnswers, getSession, truncateAll } from "./helpers/db";
import { answerAllQuestions, createSessionUI, joinSessionUI } from "./helpers/flow";

// Each test gets a fresh DB. Cheaper than `supabase db reset` and keeps the
// Realtime publication intact (which a full reset would drop & re-add).
test.beforeEach(async () => {
  await truncateAll();
});

// Two isolated browser contexts = two devices with separate localStorage,
// which is what the app uses to remember which partner you are on this device
// (see rememberPartner in src/lib/session.ts).
async function twoPartnerContexts(browser: BrowserContext["browser"]) {
  const a = await browser!.newContext();
  const b = await browser!.newContext();
  return {
    a,
    b,
    cleanup: async () => {
      await a.close();
      await b.close();
    },
  };
}

test.describe("two partners", () => {
  test("pairing: B joining unblocks A's WaitingForJoin via realtime", async ({ browser }) => {
    const { a, b, cleanup } = await twoPartnerContexts(browser);
    try {
      const pageA = await a.newPage();
      const pageB = await b.newPage();

      const code = await createSessionUI(pageA, { name: "Alice", kids: "Non" });

      // Partner A is parked on WaitingForJoin — the giant code is visible.
      await expect(pageA.getByText("Partage ce code avec ton partenaire.")).toBeVisible();
      // Code shows in two places (big copy button + descriptive paragraph);
      // the copy button is the canonical display.
      await expect(pageA.getByRole("button", { name: new RegExp(`^${code} `) })).toBeVisible();

      // Sanity: row exists, A's columns filled, B's still null.
      const before = await getSession(code);
      expect(before).not.toBeNull();
      expect(before!.partner_a_name).toBe("Alice");
      expect(before!.partner_b_name).toBeNull();

      await joinSessionUI(pageB, { code, name: "Bob", kids: "Non" });

      // Realtime assertion: A's screen flips out of WaitingForJoin into the
      // questionnaire without a reload, because the sessions row UPDATE comes
      // through the postgres_changes channel A subscribed to.
      // (With kids=Non on both sides, includeChildren=false → 44 questions.)
      //
      // CI realtime propagation can spike past 10s under load, so we give
      // this a generous 30s window before declaring it flaky.
      await expect(pageA.getByText(/^1\/\d+$/)).toBeVisible({ timeout: 30_000 });

      const after = await getSession(code);
      expect(after!.partner_b_name).toBe("Bob");
    } finally {
      await cleanup();
    }
  });

  test("full flow: both partners answer every question, see results", async ({ browser }) => {
    // The headline test. ~44 questions × 2 partners with realtime sync.
    // Generous timeout because the SwipeCard has a ~460ms commit animation;
    // 44 × 2 × ~0.5s ≈ 45s minimum just for clicks.
    test.setTimeout(180_000);

    const { a, b, cleanup } = await twoPartnerContexts(browser);
    try {
      const pageA = await a.newPage();
      const pageB = await b.newPage();

      const code = await createSessionUI(pageA, { name: "Alice", kids: "Non" });
      await joinSessionUI(pageB, { code, name: "Bob", kids: "Non" });

      // Both partners answer in parallel — exercises concurrent realtime
      // updates against the same session, the way real couples on two phones
      // would. "divergent" so the results page has both convergences and
      // divergences to render (A picks answer[0], B picks answer[1]).
      await Promise.all([
        answerAllQuestions(pageA, {
          partner: "a",
          includeChildren: false,
          strategy: "divergent",
        }),
        answerAllQuestions(pageB, {
          partner: "b",
          includeChildren: false,
          strategy: "divergent",
        }),
      ]);

      // Both should land on ResultsView. The "Nos Rôles · résultats" header
      // is unique to that component.
      await expect(pageA.getByText("Nos Rôles · résultats")).toBeVisible({ timeout: 15_000 });
      await expect(pageB.getByText("Nos Rôles · résultats")).toBeVisible({ timeout: 15_000 });

      // Both partners' names show up in the title.
      await expect(pageA.getByRole("heading", { name: /Alice.*Bob/ })).toBeVisible();

      // Persistence assertion: every answer for both partners is in the DB.
      const session = await getSession(code);
      const answersA = await countAnswers(session!.id, "a");
      const answersB = await countAnswers(session!.id, "b");
      // 44 questions when both opted out of children (housekeeping/cooking/
      // finances/logistics/values, minus children-domain items).
      expect(answersA).toBeGreaterThanOrEqual(40);
      expect(answersB).toBeGreaterThanOrEqual(40);
      expect(answersA).toBe(answersB);
    } finally {
      await cleanup();
    }
  });

  test("realtime: A sees WaitingForFinish, then auto-transitions when B finishes", async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const { a, b, cleanup } = await twoPartnerContexts(browser);
    try {
      const pageA = await a.newPage();
      const pageB = await b.newPage();

      const code = await createSessionUI(pageA, { name: "Alice", kids: "Non" });
      await joinSessionUI(pageB, { code, name: "Bob", kids: "Non" });

      // A finishes first; B is still on question 1.
      await answerAllQuestions(pageA, {
        partner: "a",
        includeChildren: false,
        strategy: "convergent",
      });

      // A should now see WaitingForFinish (header copy is unique).
      // 30s for realtime — same rationale as the pairing test above.
      await expect(pageA.getByText(/On attend que .* finisse/)).toBeVisible({ timeout: 30_000 });

      // Drive B to completion.
      await answerAllQuestions(pageB, {
        partner: "b",
        includeChildren: false,
        strategy: "convergent",
      });

      // A's screen should flip to ResultsView via realtime — no reload.
      await expect(pageA.getByText("Nos Rôles · résultats")).toBeVisible({ timeout: 15_000 });
    } finally {
      await cleanup();
    }
  });
});
