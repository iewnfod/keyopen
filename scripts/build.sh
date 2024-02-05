#!/bin/bash

if [ -n "$1" ]; then
	echo "Target platform: $1"
else
	echo "Please choose \`macos\` or \`linux\` to build."
	exit 1
fi

if [ $1 = "macos" ]; then
	source scripts/macos.sh
elif [ $1 = "linux" ]; then
	source scripts/linux.sh
else
	echo "Unsupport platform."
fi

for target in ${TARGETS[@]}
do
	echo "Building for $target"
	cargo tauri build --target $target
done
