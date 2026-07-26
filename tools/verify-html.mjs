// Compara el HTML generado contra la referencia congelada.
// Normaliza solo espacios insignificantes: recorta cada linea y descarta las
// vacias. Cualquier diferencia de contenido, atributos u orden sobrevive.
import { readFileSync } from 'node:fs';

function normalize(html) {
  return html
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

const [refPath, outPath] = process.argv.slice(2);
const refLines = normalize(readFileSync(refPath, 'utf8')).split('\n');
const outLines = normalize(readFileSync(outPath, 'utf8')).split('\n');

let firstDiff = -1;
const max = Math.max(refLines.length, outLines.length);
for (let i = 0; i < max; i += 1) {
  if (refLines[i] !== outLines[i]) {
    firstDiff = i;
    break;
  }
}

if (firstDiff === -1) {
  console.log(`OK: ${outLines.length} lineas identicas a la referencia`);
  process.exit(0);
}

console.error(`DIFERENCIA en la linea normalizada ${firstDiff + 1}`);
console.error(`  referencia: ${refLines[firstDiff] ?? '(no existe)'}`);
console.error(`  generado:   ${outLines[firstDiff] ?? '(no existe)'}`);
console.error(
  `\nTotal de lineas: referencia ${refLines.length}, generado ${outLines.length}`
);
process.exit(1);
