const fs = require("fs");
const F = "ecrans-echelle.html";
let s = fs.readFileSync(F, "utf8");

// 1. barres de commentaires decoratives -> ASCII
s = s.replace(/[─═]/g, "-");

// 2. decoupage en regions : head | <style> | html | <script> | tail
const si = s.indexOf("<style>"), se = s.indexOf("</style>");
const ji = s.indexOf("<script>"), je = s.indexOf("</script>");
if ([si, se, ji, je].some(i => i < 0)) throw new Error("regions introuvables");
if (!(si < se && se < ji && ji < je)) throw new Error("ordre inattendu");
if (s.indexOf("<script>", ji + 1) !== -1) throw new Error("plusieurs blocs script");
if (s.indexOf("<style>", si + 1) !== -1) throw new Error("plusieurs blocs style");

const head = s.slice(0, si), css = s.slice(si, se);
const mid = s.slice(se, ji), js = s.slice(ji, je), tail = s.slice(je);

// les entites HTML ne sont pas decodees dans <style> : il ne doit rien y rester
const cssLeft = [...css].filter(c => c.codePointAt(0) > 127);
if (cssLeft.length) throw new Error("non-ASCII restant dans le CSS: " + cssLeft.join(" "));

const NON_ASCII = /[^\x00-\x7F]/gu;
const BS = String.fromCharCode(92);
const ent = t => t.replace(NON_ASCII, c => "&#x" + c.codePointAt(0).toString(16).toUpperCase() + ";");
const esc = t => t.replace(NON_ASCII, c => BS + "u" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"));

const out = ent(head) + css + ent(mid) + esc(js) + ent(tail);
if (/[^\x00-\x7F]/u.test(out)) throw new Error("il reste du non-ASCII");

fs.writeFileSync(F, out, "latin1");   // pur ASCII : l'encodage de sortie n'a plus d'importance
console.log("OK - fichier 100% ASCII,", out.length, "octets");
