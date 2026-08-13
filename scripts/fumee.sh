#!/usr/bin/env bash
#
# Test de fumee de la construction : demarre le serveur de production, verifie
# que les deux langues sont servies et que le catalogue les alimente, puis
# s'arrete. Appele par les deux workflows, et lancable en local :
#
#   pnpm build && bash scripts/fumee.sh
#
# Les motifs cherches restent volontairement en ASCII : ils ne dependent alors
# ni de la locale de la machine, ni de l'encodage de ce fichier.

set -euo pipefail

PORT="${PORT:-3000}"
BASE="http://localhost:${PORT}"

journal=$(mktemp)

# Le serveur est arrete par un signal en fin de test : son code 143 est attendu
# et ne doit pas passer pour un echec. Sa sortie n'est montree que si un
# controle a effectivement echoue -- sinon elle noie le journal de la CI.
menage() {
  code=$?
  kill "$serveur" 2>/dev/null || true
  wait "$serveur" 2>/dev/null || true
  if [ "$code" != 0 ]; then
    echo "--- journal du serveur ---"
    cat "$journal"
  fi
  rm -f "$journal"
  exit "$code"
}

echo "> demarrage du serveur sur ${PORT}"
PORT="$PORT" pnpm start >"$journal" 2>&1 &
serveur=$!
trap menage EXIT

pret=0
for _ in $(seq 1 30); do
  if curl -sf -o /dev/null "${BASE}/fr"; then pret=1; break; fi
  sleep 1
done
[ "$pret" = 1 ] || { echo "ECHEC : pas de reponse en 30 s"; exit 1; }

echo "> la racine negocie la langue"
for entete in "fr-FR,fr;q=0.9" "en-GB,en;q=0.9"; do
  attendue="${entete%%-*}"
  obtenue=$(curl -s -o /dev/null -w '%{redirect_url}' -H "Accept-Language: ${entete}" "${BASE}/")
  echo "  ${entete} -> ${obtenue}"
  case "$obtenue" in
    */"$attendue") ;;
    *) echo "ECHEC : redirection vers /${attendue} attendue"; exit 1 ;;
  esac
done

fr=$(curl -sf "${BASE}/fr")
en=$(curl -sf "${BASE}/en")

echo "> chaque langue est servie dans sa langue"
grep -q 'lang="fr"' <<< "$fr" || { echo 'ECHEC : lang="fr" absent'; exit 1; }
grep -q 'lang="en"' <<< "$en" || { echo 'ECHEC : lang="en" absent'; exit 1; }

# Ces deux fragments viennent des dictionnaires : ils prouvent que chaque langue
# est servie par le sien. On cherche volontairement la partie du titre qui ne
# porte pas de compte : la version precedente cherchait "Les cinq dalles", et
# elle a casse des que la selection de depart a gagne un appareil -- exactement
# le defaut que la prose a cesse d'avoir.
echo "> chaque langue est servie par son dictionnaire"
grep -q "ligne par ligne" <<< "$fr" \
  || { echo "ECHEC : section 04, titre francais attendu"; exit 1; }
grep -q "row by row" <<< "$en" \
  || { echo "ECHEC : section 04, titre anglais attendu"; exit 1; }

# La surface de la tablette est derivee de sa seule diagonale et de sa resolution
# et vaut 446,1 cm2, la valeur publiee. La trouver prouve d'un coup que le
# fichier du catalogue est charge, que la geometrie a tourne, et que le
# separateur decimal suit la langue.
echo "> le catalogue alimente les sections"
grep -q "446,1" <<< "$fr" || { echo "ECHEC : surface de la Tab S10+ attendue en fr"; exit 1; }
grep -q "446.1" <<< "$en" || { echo "ECHEC : surface de la Tab S10+ attendue en en"; exit 1; }

# La bande de tranche est prerendue comme le reste : un profil par appareil du
# catalogue, portant son epaisseur dans --ed. Le Fold est deplie au demarrage,
# son profil doit donc porter --ed:5 et non les --ed:10.1 du chassis replie --
# ce qui prouve d'un coup que la bande est rendue et qu'elle suit le pli.
# Le controle porte sur l'attribut de style, pas sur l'etiquette : il est ainsi
# le meme dans les deux langues et ne depend d'aucun separateur decimal.
echo "> la bande de tranche suit l'etat du pli"
for langue in fr en; do
  page=$([ "$langue" = fr ] && echo "$fr" || echo "$en")
  profils=$(grep -o 'class="prof' <<< "$page" | wc -l)
  [ "$profils" -ge 1 ] \
    || { echo "ECHEC : ${langue}, aucun profil dans la bande de tranche"; exit 1; }
  grep -qE 'style="--dc:var\(--c-fold\);[^"]*--ed:5;' <<< "$page" \
    || { echo "ECHEC : ${langue}, le Fold devrait etre deplie (--ed:5)"; exit 1; }
done

# Le profil d'un pliable est deux volets articules sur sa pliure, et cette seule
# chaine atteste de tout ce qui doit tenir :
#   --eo:5    l'epaisseur d'un volet, celle du chassis deplie ;
#   --ec:10.1 l'epaisseur repliee *publiee*, dont le CSS deduit la hauteur du
#             pivot -- un empilement naif de deux volets donnerait 10,0 ;
#   --eb:0.8  le debord du dos, derive de closed.w - open.w / 2.
# Les six volets sont les deux de chacun des trois pliables.
echo "> les pliables ont une pliure articulee dans la tranche"
for langue in fr en; do
  page=$([ "$langue" = fr ] && echo "$fr" || echo "$en")
  grep -q 'class="pli" style="--eh:75.2;--eo:5;--ec:10.1;--eb:0.8"' <<< "$page" \
    || { echo "ECHEC : ${langue}, la pliure du Fold n'est pas cotee comme attendu"; exit 1; }
  volets=$(grep -o 'class="sect vol' <<< "$page" | wc -l)
  [ "$volets" -eq 6 ] \
    || { echo "ECHEC : ${langue}, 6 volets attendus, ${volets} trouves"; exit 1; }
done

# L'ouverture est un nombre, pas une classe d'etat : c'est --pli qui porte tout le
# geste, et le curseur qui le pose ou l'on veut. Au demarrage il vaut 1, deplie --
# ce qui est aussi ce que dit --ed:5 plus haut, par un tout autre chemin.
# data-libre ne doit pas etre prerendu : la transition serait coupee d'entree.
echo "> l'ouverture est pilotee par --pli"
for langue in fr en; do
  page=$([ "$langue" = fr ] && echo "$fr" || echo "$en")
  grep -q 'style="--pli:1"' <<< "$page" \
    || { echo "ECHEC : ${langue}, --pli:1 attendu au demarrage"; exit 1; }
  grep -q 'data-libre' <<< "$page" \
    && { echo "ECHEC : ${langue}, data-libre ne doit pas etre prerendu"; exit 1; }
  grep -q 'id="pli"' <<< "$page" \
    || { echo "ECHEC : ${langue}, le curseur d'ouverture est absent"; exit 1; }
done

# Le 100 % est choisi par l'utilisateur en section 02, mais il part de la
# reference du catalogue, qui n'est pas dans la selection de depart : la puce doit
# donc etre proposee avec sa mention « hors scene ». Et +87,2 % est l'ecart de la
# dalle interne du Fold *au Pixel 7 Pro* -- contre +85,0 % si la reference avait
# glisse sur un autre appareil. Ce chiffre atteste donc du repere de depart.
echo "> le 100 % part de la reference du catalogue"
for langue in fr en; do
  page=$([ "$langue" = fr ] && echo "$fr" || echo "$en")
  grep -q 'class="hors"' <<< "$page" \
    || { echo "ECHEC : ${langue}, la reference hors scene n'est pas proposee"; exit 1; }
  grep -q 'Pixel 7 Pro' <<< "$page" \
    || { echo "ECHEC : ${langue}, la reference de depart n'est pas nommee"; exit 1; }
done
grep -q "+87,2" <<< "$fr" || { echo "ECHEC : ecart au Pixel 7 Pro attendu en fr"; exit 1; }
grep -q "+87.2" <<< "$en" || { echo "ECHEC : ecart au Pixel 7 Pro attendu en en"; exit 1; }

echo "> les nombres suivent la langue"
grep -q "111,5 cm" <<< "$fr" || { echo "ECHEC : virgule decimale attendue"; exit 1; }
grep -q "111.5 cm" <<< "$en" || { echo "ECHEC : point decimal attendu"; exit 1; }

echo "OK - fumee : les deux langues repondent et sont alimentees par le catalogue"
