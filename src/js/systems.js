import { invoke } from "../lib/api/tauri.js";

let system = await invoke("get_system");

console.log(system);
