// import { invoke } from "@tauri-apps/api/tauri";

// const invoke = window.__TAURI__.invoke;
import { invoke } from "./lib/api/tauri.js";
import { register, unregister, isRegistered } from "./lib/api/globalShortcut.js";
import { open } from "./lib/api/dialog.js";

// 初始化
invoke("register", {f: "", targetPath: ""}).then(() => {});

// 读取设置并显示
invoke("get_binding").then((r) => {
    console.log(r);
    for (let i = 1; i <= 12; i ++) {
        if (r[`F${i}`]) {
            document.getElementById(`F${i}_input`).value = r[`F${i}`];
        }
    }
})

// 绑定
function bind(f) {
    register(f, (r) => {
        console.log(r);
        invoke("open", {f: r}).then(() => {});
    }).then(() => {
        console.log(`Success to bind ${f}`);
    }).catch((e) => {
        alert(`Failed to bind ${f}: \n${e}`);
        console.log(`Failed to bind ${f}: \n${e}`);
    });
}

function registerBackend(name, value) {
    console.log(`Try to register ${name} with ${value}`);
    invoke("register", {f: name, targetPath: value}).then(() => {});
}

// ui
let table_body = document.getElementById('table_body');
for (let i = 1; i <= 12; i ++) {
    let f = `F${i}`;
    // 如果已经绑定了，就解除绑定
    isRegistered(f).then(is_registered => {
        // 判断并绑定
        if (is_registered) {
            unregister(f).then(() => {
                console.log(`Unbind ${f}`);
                bind(f);
            });
        } else {
            bind(f);
        }
    });

    let ele = document.createElement('tr');
    table_body.appendChild(ele);
    ele.innerHTML = `
        <th id="${f}_th" class="f-th">
            <abbr>${f}</abbr>
        </th>
        <td>
            <div class="form-group">
                <input id="${f}_input" name="${f}">
                <button class="form-group-btn btn-primary" id="${f}_bt" name="${f}">Select</button>
                <button class="form-group-btn btn-dark" id="${f}_clear_bt" name="${f}">Clear</button>
            </div>
        </td>
    `;

    document.getElementById(`${f}_bt`).addEventListener('click', async (e) => {
        let name = e.target.name;
        open().then((v) => {
            if (v === null) {
                console.log("Cancel File Choosing");
                return;
            }
            document.getElementById(`${name}_input`).value = v;
            registerBackend(name, v);
        }).catch((err) => {
            console.log(err);
        });
    });

    document.getElementById(`${f}_input`).addEventListener('change', (e) => {
        registerBackend(e.target.name, e.target.value);
    });

    document.getElementById(`${f}_clear_bt`).addEventListener('click', (e) => {
        let name = e.target.name;
        document.getElementById(`${name}_input`).value = '';
        registerBackend(name, '');
    });
}

function heightSynchronize() {
    for (let i = 1; i <= 12; i ++) {
        let th_ele = document.getElementById(`F${i}_th`);
        let tr_ele = th_ele.parentElement;
        th_ele.style.height = `${tr_ele.offsetHeight}px`;
    }
}

heightSynchronize();
