# shellcheck shell=bash
# SPDX-FileCopyrightText: 2026 Xquik Contributors
# SPDX-License-Identifier: MIT
#
# Sourced by bin/check-local and bin/release-local from the repository root.
# resolve_pnpm finds a way to run the pnpm version that package.json pins,
# so neither script depends on a pnpm installed on this machine.
# It uses corepack, or bunx when corepack is missing. bunx runs @pnpm/exe,
# the standalone build of pnpm, because bunx cannot start the pnpm package
# on macOS.

# resolve_pnpm <fail command>
# Sets the pnpm array, or calls the fail command with 1 line that says why.
# The fail command must exit.
resolve_pnpm() {
	local fail=$1
	local pinned reported
	pinned=$(node -p "require('./package.json').packageManager")
	pinned=${pinned#pnpm@}
	pinned=${pinned%%+*}

	if command -v corepack >/dev/null 2>&1; then
		pnpm=(corepack pnpm)
	elif command -v bunx >/dev/null 2>&1; then
		pnpm=(bunx "@pnpm/exe@$pinned")
	else
		"$fail" "Install Bun or corepack to run pnpm, then retry."
	fi

	reported=$("${pnpm[@]}" --version) || reported=""
	[[ $reported == "$pinned" ]] ||
		"$fail" "The pinned pnpm is $pinned, but ${pnpm[*]} reported ${reported:-no version}."
	printf 'Running pnpm %s through %s.\n' "$reported" "${pnpm[*]}"
}
