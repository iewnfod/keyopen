cd src
npm i
cp -r node_modules/@tauri-apps/ lib/
rm -rf node_modules

cargo install create-tauri-app --locked
cargo install tauri-cli
