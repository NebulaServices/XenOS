#!/bin/bash
set -e

YELLOW='\033[1;33m'
GREEN='\033[1;32m'
BLUE='\033[1;34m'
RED='\033[1;31m'
RESET='\033[0m'

function section() {
    echo -e "${BLUE}==>${RESET} ${YELLOW}$1${RESET}"
}

function success() {
    echo -e "${GREEN}✔${RESET} $1"
}

function warn() {
    echo -e "${YELLOW}!${RESET} $1"
}

function error() {
    echo -e "${RED}✖${RESET} $1"
}

section "Starting Build..."
section "Building source code"
rm -rf ./build/ ./dist/ ./dist-transport/ ./dist-sw/ ./wisp-client-js/dist/ ./apps/

pushd ./wisp-client-js/ >/dev/null

if [ ! -d "node_modules" ]; then
    section "Installing dependencies for wisp-client-js"

    if command -v pnpm &>/dev/null; then
        pnpm install &>/dev/null
    else
        warn "pnpm not found, falling back to npm"
        echo "Tip: Run 'npm i -g pnpm' to install pnpm"

        npm install &>/dev/null
    fi
fi

popd >/dev/null

node ./scripts/build.js >/dev/null 2>&1

mkdir -p ./build/dist/
mv ./dist/* ./build/dist/
cp -r ./public/* ./build

mkdir -p ./build/libs/transport/
mv ./dist-transport/* ./build/libs/transport/

mv ./dist-sw/xen-sw.js ./build/xen-sw.js

mkdir -p ./build/libs/wisp-client-js/
mv ./wisp-client-js/dist/* ./build/libs/wisp-client-js/

success "Built source code (Including transport & wisp-client-js)"
section "Copying node_modules dependencies"

function copy_nm() {
    local in="$1"
    local out="$2"

    mkdir -p "./build/$out"
    cp -r "./node_modules/$in/"* "./build/$out/"
}

copy_nm "@titaniumnetwork-dev/ultraviolet/dist" "libs/uv"
copy_nm "@mercuryworkshop/bare-mux/dist" "libs/bare-mux"
copy_nm "libcurl.js" "libs/libcurl-js"
copy_nm "comlink/dist" "libs/comlink"

success "Copied node_modules dependencies"
section "Copying included apps"

mkdir ./apps/

function copy_app() {
    local app="$1"

    pushd "./apps-src/$app" >/dev/null
    zip -r "../../apps/$app.zip" ./* >/dev/null
    popd >/dev/null
}

copy_app "org.nebulaservices.about"
copy_app "org.nebulaservices.settings"
copy_app "org.nebulaservices.texteditor"
copy_app "org.nebulaservices.repostore"
copy_app "org.nebulaservices.files"
copy_app "org.nebulaservices.browser"
copy_app "org.nebulaservices.processmanager"
copy_app "xen.runtime"

cp -r ./apps/ ./build/apps/

success "Copied apps and libs"
section "Building Workbox libraries"

mkdir -p build/libs/workbox/
npx workbox-cli@7.3.0 copyLibraries build/libs/workbox/ >/dev/null
mv build/libs/workbox/workbox-v7.3.0/* build/libs/workbox/
rm -r build/libs/workbox/workbox-v7.3.0

success "Built Workbox"

section "Generating files.json"
node ./scripts/generate.cjs
success "Generated files.json"

section "Generating UUID"
uuidgen >./build/uuid

rm -rf ./dist/ ./dist-transport/ ./dist-sw/ ./apps/

echo ""
success "Build completed successfully!"
