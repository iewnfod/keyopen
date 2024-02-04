#!/bin/sh

echo "Building for aarch64 darwin"
cargo tauri build --target aarch64-apple-darwin
echo "Building for x86_64 darwin"
cargo tauri build --target x86_64-apple-darwin
