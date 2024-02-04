import { invoke } from "./lib/api/tauri.js";

let system = await invoke("get_system");

console.log(system);

if (system == "linux") {
	// 禁用开机自启动选项
	let startup = document.getElementById('startup');
	startup.setAttribute('disabled', 'disabled');
	startup.setAttribute('title', 'This function does not support Linux');
}
