use std::{fs::{create_dir_all, File}, io::Write, path::PathBuf, process::Command, str::FromStr, thread, time};
use enigo::{Enigo, Key, Keyboard};
use log::debug;

use crate::{binding::{BType, Binding}, constants::{APP_BUNDLE_ID, MOD_KEY_MAP}, setting::get_settings};

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
fn sub_open(target_path: &String) {
	#[cfg(target_os = "macos")]
	{
		use crate::ffi::open_file;

		let p = PathBuf::from_str(&target_path).unwrap();
		if p.exists() {
			debug!("swift open: {}", &target_path);
			open_file(&target_path);
		} else {
			sub_sub_open(target_path);
		}
	}
}

#[cfg(not(target_os = "macos"))]
fn sub_open(target_path: &String) {
	sub_sub_open(target_path);
}

fn shell_open(value: &String) {
	let str_temp_path = format!("/tmp/{}/temp_shell.sh", APP_BUNDLE_ID);
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

fn map_open(value: &String) {
	thread::sleep(
		time::Duration::from_millis(
			get_settings().map_delay_time
		)
	);

	let mut keys: Vec<&str> = value.split("+").collect();

	for i in 0..keys.len() {
		keys[i] = keys[i].trim();
	}

	debug!("{:?}", &keys);

	let mut enigo = Enigo::new(&enigo::Settings::default()).unwrap();

	let mut unicode_keys = vec![];

	for key in keys.iter() {
		match MOD_KEY_MAP.get(key) {
			Some(k) => enigo.key(*k, enigo::Direction::Press),
			None => {
				unicode_keys.push(
					Key::Unicode(*key.chars().collect::<Vec<char>>().first().unwrap())
				);
				Ok(())
			}
		}.unwrap();
	}

	for key in unicode_keys {
		debug!("{:?}", key);
		enigo.key(key, enigo::Direction::Click).unwrap();
	}

	keys.reverse();

	for key in keys.iter() {
		match MOD_KEY_MAP.get(key) {
			Some(k) => enigo.key(*k, enigo::Direction::Release),
			None => Ok(())
		}.unwrap();
	}
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
			map_open(&b.value);
		}
	}
}
