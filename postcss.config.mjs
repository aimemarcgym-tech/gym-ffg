// Tailwind v4 écrit tout son CSS dans des « @layer » et utilise color-mix, @property… : les Safari d'avant 15.4 (vieux Mac) ignorent
// alors toute la feuille de style et la page s'affiche sans mise en forme. postcss-preset-env, passé après Tailwind, aplatit les
// couches et ajoute les équivalents pour ces anciens navigateurs.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      browsers: ["safari >= 12", "ios_saf >= 12", "chrome >= 90", "firefox >= 90", "edge >= 90"],
    },
  },
};

export default config;
