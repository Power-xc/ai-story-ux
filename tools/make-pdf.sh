#!/bin/sh
# print.html -> assignment.pdf (실제 텍스트 층 포함). 저장소 루트에서 실행.
set -e
UD=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --user-data-dir="$UD" \
  --no-pdf-header-footer --print-to-pdf=assignment.pdf "file://$PWD/print.html"
rm -rf "$UD"
