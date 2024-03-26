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
	// check accessibility
	use macos_accessibility_client::accessibility;

	if !accessibility::application_is_trusted_with_prompt() {
		return false;
	}

	let apple_scripts = vec![
		format!("tell application \"{}\" to activate", app_name),
		format!("tell application \"System Events\" to click UI element \"{}\" of list 1 of application process \"Dock\"", app_name)
	];

	for apple_script in apple_scripts {
		let mut command = Command::new("osascript");
		command.arg("-e").arg(&apple_script);
		let result = command.output().unwrap();

		if !result.status.success() {
			return false;
		}
	}

	true
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
