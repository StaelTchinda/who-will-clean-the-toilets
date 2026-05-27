import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CreateForm, HomeShell, Intro, JoinForm } from "@/routes/index";

// Stage-level stories for the home route. Each story renders the same chrome
// the live `HomePage` uses (`HomeShell` — max-w-md centering, "Nos Rôles"
// header, Chapman footer) so width and surrounding context match the dev app
// exactly. The legacy component-only Intro story is folded into the `Intro`
// stage below.
//
// `CreateForm` and `JoinForm` submit to Supabase on success. Storybook aliases
// `@/integrations/supabase/client` to a fake in `.storybook/supabase-mock.ts`,
// so clicking submit hits a no-op and the form unwinds without navigation —
// the stage is the empty form, not the post-submit redirect.
const meta = {
  title: "Pages/Home",
  component: HomeShell,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomeShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stage 1 — first paint, before the user picks a path. */
export const Intro_: Story = {
  name: "Intro",
  render: () => (
    <HomeShell>
      <Intro onChoose={fn()} />
    </HomeShell>
  ),
};

/** Stage 2a — user tapped "Démarrer un questionnaire". Empty creation form. */
export const CreateFormStage: Story = {
  name: "CreateForm",
  render: () => (
    <HomeShell>
      <CreateForm onBack={fn()} />
    </HomeShell>
  ),
};

/** Stage 2b — user tapped "Rejoindre avec un code". Code-entry form. */
export const JoinFormStage: Story = {
  name: "JoinForm",
  render: () => (
    <HomeShell>
      <JoinForm onBack={fn()} />
    </HomeShell>
  ),
};
