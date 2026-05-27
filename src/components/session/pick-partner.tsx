import { Button } from "@/components/ui/button";
import { rememberPartner, type Partner, type SessionRow } from "@/lib/session";
import { Centered } from "./centered";

export function PickPartner({
  session,
  code,
  onPicked,
}: {
  session: SessionRow;
  code: string;
  onPicked: (p: Partner) => void;
}) {
  const pick = (p: Partner) => {
    rememberPartner(code, p);
    onPicked(p);
  };
  return (
    <Centered>
      <h1 className="font-serif text-3xl">Qui est-ce ?</h1>
      <p className="text-muted-foreground">Sélectionne ton prénom sur ce téléphone.</p>
      <div className="flex w-full flex-col gap-3 pt-4">
        <Button
          size="lg"
          variant="outline"
          className="h-14 rounded-full"
          onClick={() => pick("a")}
        >
          {session.partner_a_name || "Partenaire A"}
        </Button>
        {session.partner_b_name && (
          <Button
            size="lg"
            variant="outline"
            className="h-14 rounded-full"
            onClick={() => pick("b")}
          >
            {session.partner_b_name}
          </Button>
        )}
      </div>
    </Centered>
  );
}
