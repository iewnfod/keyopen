use std::{fs::{create_dir_all, File}, io::Write, path::PathBuf, process::Command, str::FromStr};
use log::debug;
use tauri::command;

use crate::{binding::{BType, Binding}, constants::APP_ID};

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
fn sub_open(target_path: &String) {
    use std::path::Path;

	let p = Path::new(target_path);

	let extension = match p.extension() {
		Some(e) => e.to_str().unwrap(),
		None => ""
	};

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
fn sub_open(target_path: &String) {
	sub_sub_open(target_path);
}

fn shell_open(value: &String) {
	let str_temp_path = format!("/tmp/{}/temp_shell.sh", APP_ID);
	let temp_path = PathBuf::from_str(str_temp_path.as_str()).unwrap();

	if !temp_path.parent().unwrap().exists() {
		create_dir_all(temp_path.parent().unwrap()).unwrap();
	}

	let mut file = File::create(temp_path).unwrap();

	file.write_all(value.as_bytes()).unwrap();

	let mut command = Command::new("/bin/sh");
	command.arg(&str_temp_path);
	debug!("{:?}", &command);

	command.spawn().unwrap();
}

#[tauri::command]
pub fn open_key(b: Binding) {
	if b.value.is_empty() {
		return;
	}
	debug!("Call: {:?}", &b);
	match b.b_type {
		BType::Path => {
			sub_open(&b.value);
		},
		BType::Shell => {
			shell_open(&b.value);
		},
		BType::Map => {
			debug!("Not Supported");
		}
	}
}
