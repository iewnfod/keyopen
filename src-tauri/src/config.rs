use std::{path::Path, fs::create_dir_all};
use std::env::current_exe;
use std::path::PathBuf;
use auto_launch::AutoLaunch;

const APP_ID: &str = "com.iewnfod.keyopen";
const APP_NAME: &str = "KeyOpen";
const CONFIG_NAME: &str = "keyopen_config.json";

static mut CONFIG_PATH: Option<String> = None;


fn get_user_home() -> PathBuf {
	let user = users::get_user_by_uid(users::get_current_uid()).unwrap();
	if cfg!(target_os = "macos") {
		Path::new("/Users").join(user.name())
	} else if cfg!(target_os = "linux") {
		Path::new("/home").join(user.name())
	} else {
		Path::new(user.name()).to_path_buf()
	}
}

fn get_auto_launcher() -> AutoLaunch {
	let mut exe_path = current_exe().unwrap();
	while exe_path.is_symlink() {
		exe_path = exe_path.read_link().unwrap();
	}

	let os_str_exe_path = exe_path.as_mut_os_str();
	let str_exe_path = os_str_exe_path.to_str().unwrap();
	let args = [""];

	#[cfg(target_os = "linux")]
	let launcher = AutoLaunch::new(
		APP_NAME,
		str_exe_path,
		&args,
	);

	#[cfg(target_os = "macos")]
	let launcher = AutoLaunch::new(
		APP_NAME,
		str_exe_path,
		false,
		&args,
	);

	launcher
}

fn set_startup() -> bool {
	get_auto_launcher().enable().is_ok()
}

fn remove_startup() -> bool {
	get_auto_launcher().disable().is_ok()
}

fn generate_config_path() {
	let home = get_user_home();
	let mut config_path = home.join(".config").join(APP_ID);
	if cfg!(target_os = "macos") {
		config_path = home.join("Library").join("Application Support").join(APP_ID);
	}

	if !config_path.exists() {
		create_dir_all(&config_path).unwrap();
	}

	let config_file = config_path.join(CONFIG_NAME);
	let string_path = config_file.as_os_str().to_str().unwrap();

	println!("{}", string_path);
	unsafe {
		CONFIG_PATH = Some(string_path.to_string());
	}
}

// public functions
pub fn init() {
	generate_config_path();
}

pub fn startup_exists() -> bool {
	get_auto_launcher().is_enabled().unwrap()
}

pub fn toggle_startup() -> bool {
	if startup_exists() {
		remove_startup()
	} else {
		set_startup()
	}
}

pub fn get_config_path() -> String {
	unsafe {
		CONFIG_PATH.clone().unwrap().to_string()
	}
}
