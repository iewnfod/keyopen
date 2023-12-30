import { invoke } from "./lib/api/tauri.js";
import {register, unregister, isRegistered, unregisterAll} from "./lib/api/globalShortcut.js";
import { open } from "./lib/api/dialog.js";

let is_listening = true;

const settings = ['startup', 'show_when_open', 'repo'];

function openBinding(f) {
    invoke("open", {f: f}).then(() => {});
}

invoke("register", {f: "repo", targetPath: "https://github.com/iewnfod/keyopen"}).then(() => {});
document.getElementById('to-repo').addEventListener('click', () => {
    openBinding("repo");
});


// 绑定到按键
function _bind(f) {
    register(f, (r) => {
        console.log(r);
        openBinding(r);
    }).then(() => {
        console.log(`Success to bind ${f}`);
    }).catch((e) => {
        console.log(`Failed to bind ${f}: \n${e}`);
    });
}

function bind(f) {
    isRegistered(f).then((r) => {
        if (r) {
            unregister(f).then(() => {
                console.log(`Unregistered ${f}`);
                _bind(f);
            });
        } else {
            _bind(f);
        }
    });
}

// 向后端绑定按键
function registerBackend(uuid, value) {
    let name = bindings[uuid];
    if (name) {
        console.log(`Try to register ${name} with ${value}`);
        invoke("register", {f: name, targetPath: value}).then(() => {});
    } else {
        console.log(`Failed to get shortcut of ${uuid}`);
    }
}

function getUuid () {
    let unique = 0
    const time = Date.now()
    const random = Math.floor(Math.random() * 1000000000)
    unique++
    return random + unique + String(time);
}

// 读取绑定并显示
let table_body = document.getElementById('table_body');
let selected = undefined;

function clear_selected() {
    if (selected !== undefined) {
        document.getElementById(`${selected}_tr`).classList.remove('tr-selected');
        selected = undefined;
    }
}

// 阻止向上冒泡
function stopBubble(e) {
    if (e && e.stopPropagation) {
        e.stopPropagation();
    } else {
        window.event.cancelBubble=true;
    }
}

// 切换绑定的按键
function change_shortcut(name, to_value) {
    let value = document.getElementById(`${name}_input`).value;
    // 解绑原来的事件
    unregister(bindings[name]).then(() => {});
    registerBackend(name, '');
    // 修改绑定
    bindings[name] = to_value;
    // 向后端注册
    registerBackend(name, value);
    // 注册全局快捷键
    bind(bindings[name]);
}

let bindings = {};

function new_key(key, value) {
    // 绑定按键
    if (is_listening) {
        bind(key);
    }
    // 创建元素
    let ele = document.createElement('tr');
    let uuid = getUuid();
    bindings[uuid] = key;
    key = uuid;
    ele.id = `${key}_tr`;
    ele.name = key;
    table_body.appendChild(ele);
    ele.innerHTML = `
        <th id="${key}_th" name="${key}">
            <div class="form-group" name="${key}">
                <button name="${key}" class="form-group-btn" id="${key}_unlock_bt">Unlock</button>
                <input name="${key}" id="${key}_shortcut_input" style="border-top-left-radius: 0; border-bottom-left-radius: 0" disabled>
            </div>
        </th>
        <td name="${key}">
            <div class="form-group">
                <input id="${key}_input" name="${key}">
                <button class="form-group-btn btn-primary" id="${key}_bt" name="${key}">Select</button>
                <button class="form-group-btn btn-dark" id="${key}_clear_bt" name="${key}">Clear</button>
            </div>
        </td>
    `;

    // 焦点切换
    ele.addEventListener('click', (event) => {
        stopBubble(event);
        let name = event.target.getAttribute('name');
        let ele = document.getElementById(`${name}_tr`);
        // 去除已选择的
        clear_selected();
        // 新建选择的
        selected = name;
        ele.classList.add('tr-selected');
    });

    // 显示绑定的值
    document.getElementById(`${key}_input`).value = value;
    document.getElementById(`${key}_shortcut_input`).value = bindings[key];

    // 选择按键绑定
    document.getElementById(`${key}_bt`).addEventListener('click', (event) => {
        let name = event.target.name;
        open().then((v) => {
            if (v === null) {
                console.log("Cancel File Choosing");
                return;
            }
            document.getElementById(`${key}_input`).value = v;
            registerBackend(key, v);
        }).catch((err) => {
            console.log(err);
        });
    });

    document.getElementById(`${key}_input`).addEventListener('change', (event) => {
        registerBackend(event.target.name, event.target.value);
    });

    // 取消锁定按键绑定
    document.getElementById(`${key}_unlock_bt`).addEventListener('click', (event) => {
        let name = event.target.name;
        document.getElementById(`${key}_shortcut_input`).disabled = false;
        document.getElementById(`${key}_shortcut_input`).focus();
    });

    // 取消focus时，锁定
    document.getElementById(`${key}_shortcut_input`).addEventListener('focusout', (event) => {
        event.target.disabled = true;
        change_shortcut(event.target.name, event.target.value);
    });

    // 回车时，尝试绑定
    document.getElementById(`${key}_shortcut_input`).addEventListener('change', (event) => {
        change_shortcut(event.target.name, event.target.value);
    });

    // 清空按键绑定
    document.getElementById(`${key}_clear_bt`).addEventListener('click', (event) => {
        let name = event.target.name;
        document.getElementById(`${key}_input`).value = '';
        registerBackend(name, '');
    });

    return key;
}

function restore_keys() {
    invoke("get_binding").then((r) => {
        let keys = Object.keys(r);
        for (let i = 0; i < keys.length; i ++) {
            let key = keys[i];
            if (settings.indexOf(key) !== -1) continue;
            if (r[key] === '') continue;

            new_key(key, r[key]);
        }
    });
}

restore_keys();

// 添加设置
for (let i = 0; i < settings.length; i ++) {
    if (document.getElementById(settings[i])) {
        document.getElementById(settings[i]).addEventListener('click', (e) => {
            let name = e.target.id;
            invoke("toggle_settings", {name: name}).then(() => {});
        });
    }
}

invoke('get_settings').then((r) => {
    for (let i = 0; i < settings.length; i ++) {
        let setting = settings[i];
        if (r[setting]) {
            if (document.getElementById(setting)) {
                document.getElementById(setting).checked = r[setting];
            }
        }
    }
});

// 创建新快捷键
document.getElementById('new_key').addEventListener('click', (e) => {
    let key = new_key('', '');
    document.getElementById(`${key}_unlock_bt`).click();
});

document.getElementById('remove_key').addEventListener('click', (e) => {
    if (selected === undefined) return;
    let name = selected;
    registerBackend(name, '');
    unregister(bindings[name]).then(() => {
        console.log(`Unregistered ${name} ${bindings[name]}`);
        document.getElementById(`${name}_tr`).remove();
        clear_selected();
        selected = undefined;
    });
});

function toggle_listen(target) {
    // 解绑所有按键
    unregisterAll().then(() => {
        // 记录之前的滚动到的位置
        let scrollX = window.scrollX;
        let scrollY = window.scrollY;
        // 重新渲染表格，并重新绑定
        table_body.innerHTML = '';
        restore_keys();
        // 回复位置
        window.scrollTo(scrollX, scrollY);
        if (is_listening) {
            document.getElementById('stopped').style.display = 'none';
            document.getElementById('running').style.display = '';
        } else {
            document.getElementById('running').style.display = 'none';
            document.getElementById('stopped').style.display = '';
        }
    });
}

document.getElementById('toggle_listen').addEventListener('click', (e) => {
    is_listening = !is_listening;
    toggle_listen(is_listening);
});

// 窗口级监听
window.addEventListener('click', (event) => {
    clear_selected();
});
