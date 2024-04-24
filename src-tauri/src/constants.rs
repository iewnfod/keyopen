use lazy_static::lazy_static;
use std::{collections::HashMap, sync::Mutex};

#[cfg(target_os = "linux")]
pub const OPEN: &str = "xdg-open";
#[cfg(target_os = "windows")]
pub const OPEN: &str = "explorer";
#[cfg(target_os = "macos")]
pub const OPEN: &str = "open";

pub const APP_ID: &str = "com.iewnfod.keyopen";
pub const APP_NAME: &str = "KeyOpen";
pub const CONFIG_NAME: &str = "keyopen_config.json";

pub const BINDING_FILE_NAME: &str = "bindings.json";
pub const SETTING_FILE_NAME: &str = "settings.json";
