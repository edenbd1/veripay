#!/bin/bash
# Usage: pnpm run test:pdf -- fichier.pdf [fichier2.pdf ...]
# Sans argument : teste tous les PDF du répertoire courant

# Ignorer les "--" que npm/pnpm passe
PDFS=()
for arg in "$@"; do
  [[ "$arg" != "--" ]] && PDFS+=("$arg")
done

# Si aucun argument, prendre tous les PDF du répertoire
if [[ ${#PDFS[@]} -eq 0 ]]; then
  for f in *.pdf; do
    [[ -f "$f" ]] && PDFS+=("$f")
  done
fi

if [[ ${#PDFS[@]} -eq 0 ]]; then
  echo "Usage: pnpm run test:pdf -- fichier.pdf [fichier2.pdf ...]"
  echo ""
  echo "PDFs disponibles :"
  ls -1 *.pdf 2>/dev/null | sed 's/^/  /'
  exit 1
fi

PORT=3000

if ! lsof -ti :$PORT > /dev/null 2>&1; then
  echo "⚠️  Serveur non démarré. Lance d'abord : npx tsx src/index.ts"
  exit 1
fi

for PDF in "${PDFS[@]}"; do
  if [[ ! -f "$PDF" ]]; then
    echo "❌ Fichier introuvable : $PDF"
    echo ""
    continue
  fi

  echo "━━━ $PDF ━━━"

  curl -s -F "pdf=@$PDF" "http://localhost:$PORT/bulletins/analyser" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d);
  if(j.erreur){console.log('❌',j.erreur);process.exit(1)}
  console.log(j.nombreBulletins+' bulletin(s) | '+j.nombrePages+' page(s)');
  console.log('');

  const valides=j.bulletins.filter(b=>b.valide).length;
  const invalides=j.bulletins.length-valides;
  if(invalides===0){
    console.log('✅ Tous les bulletins sont valides');
  } else {
    console.log('❌ '+invalides+'/'+j.bulletins.length+' bulletin(s) en erreur');
  }
  console.log('');

  for(let i=0;i<j.bulletins.length;i++){
    const b=j.bulletins[i];
    const status=b.valide?'✅':'❌';
    const label=status+' '+(b.salarie||'Bulletin '+(i+1));
    const periode=b.periode?' ('+b.periode+')':'';
    console.log(label+periode);
    for(const e of b.erreurs){
      console.log('   → ['+e.type+'] '+e.message);
    }
  }
  console.log('');
});
"
done
