function section {
    param([string]$Message)
    Write-Host "`e[34m==>`e[0m `e[1;33m$Message`e[0m"
}

function success {
    param([string]$Message)
    Write-Host "`e[32m✔`e[0m $Message"
}

function warn {
    param([string]$Message)
    Write-Host "`e[1;33m!`e[0m $Message"
}

function error {
    param([string]$Message)
    Write-Host "`e[1;31m✖`e[0m $Message"
}

section "Starting Build..."
section "Building source code"

Remove-Item -Recurse -Force ./build/, ./dist/, ./dist-transport/, ./dist-sw/, ./wisp-client-js/dist/, ./apps/ -ErrorAction SilentlyContinue

Push-Location ./wisp-client-js/

if (-not (Test-Path "node_modules")) {
    section "Installing dependencies for wisp-client-js"

    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install | Out-Null
    }
    else {
        warn "pnpm not found, falling back to npm"
        Write-Host "Tip: Run 'npm i -g pnpm' to install pnpm"
        npm install | Out-Null
    }
}

Pop-Location

node ./scripts/build.js | Out-Null

New-Item -ItemType Directory -Force ./build/dist/ | Out-Null
Move-Item ./dist/* ./build/dist/
Copy-Item -Recurse ./public/* ./build/

New-Item -ItemType Directory -Force ./build/libs/transport/ | Out-Null
Move-Item ./dist-transport/* ./build/libs/transport/

Move-Item ./dist-sw/xen-sw.js ./build/xen-sw.js

New-Item -ItemType Directory -Force ./build/libs/wisp-client-js/ | Out-Null
Move-Item ./wisp-client-js/dist/* ./build/libs/wisp-client-js/

success "Built source code (Including transport & wisp-client-js)"
section "Copying node_modules dependencies"

function CopyNm {
	[CmdletBinding()]

	param(
		[string]$In,
		[string]$Out
	)

	New-Item -ItemType Directory -Force "./build/$Out" | Out-Null;
	Copy-Item -Recurse "./node_modules/$In/*" "./build/$Out/";`
	Get-ChildItem -Path "./build/$Out" -Recurse -Include '*.map' | Remove-Item -Force;
}

copy_nm "@titaniumnetwork-dev/ultraviolet/dist" "libs/uv"
copy_nm "@mercuryworkshop/bare-mux/dist" "libs/bare-mux"
copy_nm "libcurl.js" "libs/libcurl-js"
copy_nm "comlink/dist" "libs/comlink"

success "Copied node_modules dependencies"
section "Copying included apps"

New-Item -ItemType Directory -Force ./apps/ | Out-Null

function copy_app {
    param([string]$app)

    Push-Location "./apps-src/$app"
    Compress-Archive -Path ./* -DestinationPath "../../apps/$app.zip" -CompressionLevel Optimal -Force | Out-Null
    Pop-Location
}

copy_app "org.nebulaservices.about"
copy_app "org.nebulaservices.settings"
copy_app "org.nebulaservices.texteditor"
copy_app "org.nebulaservices.repostore"
copy_app "org.nebulaservices.files"
copy_app "org.nebulaservices.browser"
copy_app "org.nebulaservices.processmanager"
copy_app "org.nebulaservices.terminal"
copy_app "org.nebulaservices.firewall"
copy_app "xen.runtime"
copy_app "xen.kv"

Copy-Item -Recurse ./apps/ ./build/apps/

success "Copied apps and libs"

section "Generating files.json"
node ./scripts/generate.cjs
success "Generated files.json"

section "Generating UUID"
[guid]::NewGuid().ToString() | Set-Content ./build/uuid

Remove-Item -Recurse -Force ./dist/, ./dist-transport/, ./dist-sw/, ./apps/ -ErrorAction SilentlyContinue

Write-Host ""
success "Build completed successfully!"