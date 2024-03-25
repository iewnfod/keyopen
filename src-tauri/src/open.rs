use std::process::Command;
use log::debug;

fn sub_sub_open(target_path: &String) {
	use crate::constants::OPEN;

	let mut command = Command::new(OPEN);
	command.arg(target_path);

	let result = command.output().unwrap();

	// 如果没有成功，就尝试直接运行这个东西
	if !result.status.success() {
		debug!("Failed to open {}", target_path);
		debug!("Try to run directly");
		let mut target_command = Command::new(target_path);
		let _ = target_command.spawn();
	} else {
		debug!("Success to open {}", target_path);
	}
}

#[cfg(target_os = "macos")]
fn run_show_window_apple_script(app_name: &String) -> bool {
	let apple_script_1 = format!("tell application \"{}\" to activate", app_name);
	let apple_script_2 = format!("tell application \"System Events\" to click UI element \"{}\" of list 1 of application process \"Dock\"", app_name);

	let mut command1 = Command::new("osascript");
	command1.arg("-e").arg(&apple_script_1);
	let result1 = command1.output().unwrap();

	let mut command2 = Command::new("osascript");
	command2.arg("-e").arg(&apple_script_2);
	let result2 = command2.output().unwrap();

	result1.status.success() && result2.status.success()
}

#[cfg(target_os = "macos")]
pub fn sub_open(target_path: &String) {
    use std::path::Path;

	let p = Path::new(target_path);

	let extension = p
		.extension()
		.unwrap()
		.to_str()
		.unwrap();

	if extension == "app" {
		let app_name = p.file_stem().unwrap().to_str().unwrap();
		debug!("Try to activate {}'s window", app_name);
		if !run_show_window_apple_script(&app_name.to_string()) {
			debug!("Failed to activate {}'s window. Try to open it", app_name);
			sub_sub_open(target_path);
		} else {
			debug!("Success to activate {}'s window", app_name);
		}
	} else {
		sub_sub_open(target_path);
	}
}

#[cfg(not(target_os = "macos"))]
pub fn sub_open(target_path: &String) {
	sub_sub_open(target_path);
}
