#!/bin/sh
# Uso: sh tests/run.sh tests/<pagina>.test.html
# Roda a página no Chrome headless e falha se houver "TEST FAIL"
# ou se a linha "TESTS DONE" não aparecer.

set -u

PAGE="${1:?informe a página de teste}"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT

to_url() {
    if command -v cygpath >/dev/null 2>&1; then
        printf 'file:///%s' "$(cygpath -m "$1")"
    else
        printf 'file://%s' "$1"
    fi
}

profile_path() {
    if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

OUT="$("$CHROME" --headless=new --disable-gpu \
    --user-data-dir="$(profile_path "$PROFILE")" \
    --allow-file-access-from-files \
    --enable-logging=stderr --v=0 \
    --virtual-time-budget=8000 \
    --dump-dom "$(to_url "$ROOT/$PAGE")" 2>&1 >/dev/null \
    | grep -oE '(TEST (PASS|FAIL)|TESTS DONE)[^"]*')"

printf '%s\n' "$OUT"

printf '%s\n' "$OUT" | grep -q '^TEST FAIL' && exit 1
printf '%s\n' "$OUT" | grep -q '^TESTS DONE' || { echo "ERRO: a página não terminou (sem TESTS DONE)"; exit 1; }
exit 0
