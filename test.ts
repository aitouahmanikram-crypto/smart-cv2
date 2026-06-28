import { createRequire } from "module";
const require = createRequire(import.meta.url);
let pdfParse: any;
try {
  const mod = require("pdf-parse/lib/pdf-parse.js");
  pdfParse = mod.default || mod;
} catch (e) {
  console.log(e);
}
console.log(typeof pdfParse);
