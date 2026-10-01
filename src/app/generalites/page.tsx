import ReglementationRegionale from "@/components/ReglementationRegionale";
import generalites from "@/regulation/data/gaf/generalites.json";

export default function GeneralitesPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Généralités GAF · saison {generalites.saison}</h1>
        <p className="text-sm text-muted">Source : {generalites.source}.</p>
      </div>

      <ReglementationRegionale />
    </div>
  );
}
