#!/bin/sh
# Xcode Cloud: no production credentials are needed for the bundled Scout Kit.
set -eu
cd "$CI_PRIMARY_REPOSITORY_PATH"
if ! command -v node >/dev/null 2>&1; then
  export HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_INSTALL_CLEANUP=1
  brew install node@22
  export PATH="$(brew --prefix node@22)/bin:$PATH"
fi
npx --yes pnpm@10.33.3 install --frozen-lockfile
npx --yes pnpm@10.33.3 run build:ios
