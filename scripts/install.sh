#!/bin/sh
# Installs the plugin into the DeepSeek Harness profile fallback (resolvable
# from every profile) and registers it in the home-level patch (all profiles).
# Linux/macOS variant of scripts/install.ps1.
set -e

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
HOMEDSH="${DSH_HOME:-$HOME/.dsh}"
FALLBACK="$HOMEDSH/profiles/node_modules"
TARGET="$FALLBACK/dsh-deepseek-price-timer"

if [ ! -d "$HOMEDSH" ]; then
  echo "No se encontró $HOMEDSH (¿tienes DSH instalado?)" >&2
  exit 1
fi
mkdir -p "$FALLBACK"

if [ -L "$TARGET" ]; then
  echo "symlink ya existe: $TARGET -> $(readlink "$TARGET")"
elif [ -e "$TARGET" ]; then
  rm -rf "$TARGET"
  ln -s "$PROJECT" "$TARGET"
  echo "reemplazado por symlink: $TARGET -> $PROJECT"
else
  ln -s "$PROJECT" "$TARGET"
  echo "symlink creado: $TARGET -> $PROJECT"
fi

PATCH="$HOMEDSH/cordis.patch.yml"
ROW="
# dsh-deepseek-price-timer: DeepSeek peak/valley widget (all profiles).
- insert:
    - id: dspt-permanent
      name: 'dsh-deepseek-price-timer'
"
if [ -f "$PATCH" ]; then
  if grep -q 'dspt-permanent' "$PATCH"; then
    echo "fila ya registrada en $PATCH"
  else
    printf '%s' "$ROW" >> "$PATCH"
    echo "fila añadida a $PATCH"
  fi
else
  printf '# Home-level patch applied to every profile.\n%s' "$ROW" > "$PATCH"
  echo "patch home creado: $PATCH"
fi

echo ""
echo "Instalado. Reinicia el servidor web (dsh web) y recarga la página."
