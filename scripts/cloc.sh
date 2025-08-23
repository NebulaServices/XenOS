#!/bin/bash

npm i -g cloc &> /dev/null

rm -rf node_modules/
rm -rf wisp-client-js/
rm -rf build/
rm -f pnpm-lock.yaml
rm -f package-lock.json

cloc ./

pnpm i &> /dev/null
git submodule update --init &> /dev/null
pnpm build &> /dev/null

echo "rebuilt`