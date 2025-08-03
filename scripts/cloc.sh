#!/bin/bash

rm -rf node_modules/
rm -rf wisp-client-js/
rm -rf build/
rm -f pnpm-lock.yaml

cloc ./

echo ""
echo "rebuilding..."
pnpm i &> /dev/null
git submodule update --init &> /dev/null
pnpm build &> /dev/null
echo "rebuilt"