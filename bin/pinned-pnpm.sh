# shellcheck shell=bash
# SPDX-FileCopyrightText: 2026 Xquik Contributors
# SPDX-License-Identifier: MIT

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
