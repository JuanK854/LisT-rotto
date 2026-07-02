// Importa la lista de alumnos a Firestore.
// Uso:  node --env-file=.env.local scripts/import-students.mjs lista.csv
// El CSV puede ser una columna de nombres (con o sin encabezado "nombre").

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node --env-file=.env.local scripts/import-students.mjs <archivo.csv>");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore();

const normalize = (t) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const lines = readFileSync(file, "utf8")
  .split(/\r?\n/)
  .map((l) => l.split(",")[0].replace(/^"|"$/g, "").trim())
  .filter(Boolean)
  .filter((l, i) => !(i === 0 && /^nombres?$/i.test(l)));

if (lines.length === 0) {
  console.error("El archivo no tiene nombres.");
  process.exit(1);
}

const batch = db.batch();
for (const name of lines) {
  // ID determinista a partir del nombre normalizado: re-ejecutar no duplica
  const id = normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  batch.set(
    db.collection("students").doc(id),
    { name, nameNormalized: normalize(name), active: true },
    { merge: true }
  );
}
await batch.commit();
console.log(`Importados/actualizados ${lines.length} alumnos.`);
