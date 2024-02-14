#!/bin/bash

if [ -n "$1" ]; then
	echo "Target platform: $1"
else
	echo "Please choose \`macos\` or \`linux\` to build"
	exit 1
fi

script_path="scripts/$1.sh"
if [ -e $script_path ]; then
	source "$script_path"
else
	echo "Cannot find $script_path"
fi

for target in ${TARGETS[@]}
do
	echo "Building for $target"
	cargo tauri build --target $target
done
