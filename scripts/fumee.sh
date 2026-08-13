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

# Ces deux titres viennent du catalogue : ils prouvent d'un coup que la selection
# de depart est appliquee et que les deux dictionnaires servent.
echo "> le catalogue alimente les sections"
grep -q "Les cinq dalles, ligne par ligne" <<< "$fr" \
  || { echo "ECHEC : section 04, titre francais attendu"; exit 1; }
grep -q "The five panels, row by row" <<< "$en" \
  || { echo "ECHEC : section 04, titre anglais attendu"; exit 1; }

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

echo "> les nombres suivent la langue"
grep -q "111,5 cm" <<< "$fr" || { echo "ECHEC : virgule decimale attendue"; exit 1; }
grep -q "111.5 cm" <<< "$en" || { echo "ECHEC : point decimal attendu"; exit 1; }

echo "OK - fumee : les deux langues repondent et sont alimentees par le catalogue"
