import { redirect } from "next/navigation";

// Ancienne adresse : renvoie vers le programme d'entraînement.
export default function EntrainementPage() {
  redirect("/entrainement/programme/");
}
