default:
  @just --list

build: build-linux build-mac build-mac-intel build-windows

build-linux:
  @echo "[INFO] Building Linux executable…"
  deno compile --allow-read --allow-write --output build/linux/chronver --target x86_64-unknown-linux-gnu cli.ts

build-mac:
  @echo "[INFO] Building macOS executable…"
  deno compile --allow-read --allow-write --output build/mac/chronver --target aarch64-apple-darwin cli.ts

build-mac-intel:
  @echo "[INFO] Building macOS (Intel) executable…"
  deno compile --allow-read --allow-write --output build/mac_intel/chronver --target x86_64-apple-darwin cli.ts

build-windows:
  @echo "[INFO] Building Windows executable…"
  deno compile --allow-read --allow-write --output build/windows/chronver --target x86_64-pc-windows-msvc cli.ts

clean:
  rm -rf build

lint:
  deno check && deno lint

test:
  deno test --allow-read --allow-write --fail-fast

dev:
  deno run --allow-read --allow-write --watch mod.ts

release: version clean build
  @echo "[INFO] Release versioned and built"

start:
  deno run --allow-read --allow-write mod.ts

version:
  @echo "[INFO] Updating version.txt with ChronVer"
  @deno eval "const now = new Date(); const version = \`\${now.getFullYear()}.\${String(now.getMonth() + 1).padStart(2, '0')}.\${String(now.getDate()).padStart(2, '0')}\`; console.log(version); await Deno.writeTextFile('version.txt', version);"
  @echo "[INFO] Version updated: $(cat version.txt)"
