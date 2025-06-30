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

HELP="
Usage: build [options]

Options:
    (there isn't a lot here rn because most of them were broken,.,.)
  --all        Run all build steps
  --help       Show this message

If no options are provided, --help is shown.
"

DO_ESM=false
DO_NM=false
DO_WB=false
DO_UUID=false
DO_FILES=false

if [ $# -eq 0 ]; then
    echo "$HELP"
    exit 0
fi

for arg in "$@"; do
    case "$arg" in
        --all)
            DO_ESM=true
            DO_NM=true
            DO_WB=true
            DO_UUID=true
            DO_FILES=true
            ;;
        --help)
            echo "$HELP"
            exit 0
            ;;
        *)
            error "Unknown option: $arg"
            echo "$HELP"
            exit 1
            ;;
    esac
done

section "Starting Build..."

if [ "$DO_ESM" = true ]; then
    section "Building source code"

    rm -rf ./build/ ./dist/ ./dist-transport/ ./wisp-client-js/dist/

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

    mkdir -p ./build/libs/wisp-client-js/
    mv ./wisp-client-js/dist/* ./build/libs/wisp-client-js/

    success "Built source code (Including transport & wisp-client-js)"
fi

if [ "$DO_NM" = true ]; then
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
    copy_nm "idb-keyval/dist" "libs/idb-keyval"
    copy_nm "comlink/dist" "libs/comlink"
    copy_nm "mime/dist" "libs/mime"
    copy_nm "jszip/dist" "libs/jszip"

    rm -rf build/libs/idb-keyval/test build/libs/idb-keyval/src

    success "Copied node_modules dependencies"
fi

if [ "$DO_WB" = true ]; then
    section "Building Workbox libraries"

    mkdir -p build/libs/workbox/
    npx workbox-cli@7.3.0 copyLibraries build/libs/workbox/ >/dev/null
    mv build/libs/workbox/workbox-v7.3.0/* build/libs/workbox/
    rm -r build/libs/workbox/workbox-v7.3.0

    success "Built Workbox"
fi

if [ "$DO_FILES" = true ]; then
    section "Generating files.json"
    node ./scripts/generate.cjs
    success "Generated files.json"
fi

if [ "$DO_UUID" = true ]; then
    section "Generating UUID"
    uuidgen >./build/uuid
    success "Generated UUID"
fi

if [ "$DO_ESM" = true ]; then
    rm -rf ./dist/ ./dist-transport/
fi

echo ""
success "Build completed successfully!"
