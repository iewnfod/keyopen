import {alpha, Box, FormControl, IconButton, InputLabel, MenuItem, Select, Switch, TextField, Toolbar} from "@mui/material";
import Typography from "@mui/material/Typography";
import React from "react";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from '@mui/icons-material/Add';
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Checkbox from "@mui/material/Checkbox";
import {invoke} from "@tauri-apps/api";
import TableBody from "@mui/material/TableBody";
import {useRecordHotkeys} from "react-hotkeys-hook";
import Commands from "../commands.js";
import {register, unregisterAll} from "@tauri-apps/api/globalShortcut";
import {exists} from "@tauri-apps/api/fs";
import {open} from "@tauri-apps/api/dialog";

const columns = [
    'Key', 'Type', 'Value', 'Enabled'
];

let rawRows = await invoke(Commands.getBindings);

const modKeys = {
    alt: "⌥",
    meta: "⌘",
    command: "⌘",
    ctrl: "⌃",
    shift: "⇧",
    enter: "⏎",
    backspace: "⌫",
    escape: "⎋",
    tab: "⇥",
    space: "␣",
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
    capslock: "⇪",
    backquote: "`",
    quote: "'",
    slash: "/",
    equal: "=",
    minus: "-"
};

function getUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function BindingTableToolbar(props) {
    const { selectNum, onDelete, onNew } = props;

    return (
        <Toolbar
            sx={{
                transition: "all ease-in-out .3s",
                ...(selectNum > 0 && {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity)
                })
            }}
        >
            { selectNum > 0 ? (
                <Typography
                    sx={{ flex: '1 1 100%' }}
                    variant="subtitle1"
                    component="div"
                    color="inherit"
                >
                    {selectNum} { selectNum === 1 ? "binding" : "bindings" } selected
                </Typography>
            ) : (
                <Typography
                    sx={{ flex: '1 1 100%' }}
                    component="div"
                    variant="h6"
                    id="tableTitle"
                >
                    Bindings
                </Typography>
            )}

            { selectNum > 0 ? (
                <Tooltip title="Delete">
                    <IconButton onClick={onDelete}>
                        <DeleteIcon/>
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip title="New Binding">
                    <IconButton onClick={onNew}>
                        <AddIcon/>
                    </IconButton>
                </Tooltip>
            )}
        </Toolbar>
    );
}

function BindingTableHead(props) {
    const { selected, rows, onSelectAllClick } = props;

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox" sx={{pl: 1}}>
                    <Checkbox
                        color="primary"
                        indeterminate={selected.length > 0 && selected.length !== rows.length}
                        checked={selected.length === rows.length}
                        onChange={onSelectAllClick}
                        inputProps={{
                            'aria-label': 'Select All Rows'
                        }}
                    />
                </TableCell>
                { columns.map(column => (
                    <TableCell key={column}>
                        <Typography
                            variant="subtitle1"
                        >
                            {column}
                        </Typography>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

function TypeSelect(props) {
    const { currentType, onTypeChange } = props;

    return (
        <Box sx={{minWidth: 25}}>
            <FormControl
                fullWidth
                size="small"
            >
                <Select
                    id="type-select"
                    value={currentType}
                    onChange={onTypeChange}
                >
                    <MenuItem value="Path">Path</MenuItem>
                    <MenuItem value="Shell">Shell Script</MenuItem>
                    <MenuItem value="Map">Key Map</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
}

function RecordHotKeyField(props) {
    const { currentHotKey, onHotKeyChange, checkValid } = props;
    const [keys, { start, stop, isRecording }] = useRecordHotkeys();

    let alphabet = [];
    for (let i = 0; i < 26; i ++) {
        alphabet.push(String.fromCharCode(97 + i));
    }

    function startRecordHotKey() {
        start();
    }

    function stopRecordHotKey() {
        stop();
        if (keys.size) {
            if (!checkValid || validKey()) {
                onHotKeyChange(Array.from(keys).filter((v) => v !== 'unidentified'));
            }
        }
    }

    function keyListToString(keyList) {
        let newKeys = [];
        for (let i = 0; i < keyList.length; i++) {
            if (keyList[i] === 'unidentified') {
                continue;
            }
            if (modKeys.hasOwnProperty(keyList[i])) {
                newKeys.push(modKeys[keyList[i]]);
            } else {
                newKeys.push(keyList[i].toUpperCase());
            }
        }
        return newKeys.join(' + ');
    }

    function validKey() {
        let hasModKey = false;
        let hasCodeKey = false;
        let hasFKey = false;
        let keyArray = isRecording ? Array.from(keys) : currentHotKey;
        for (let i = 0; i < keyArray.length; i++) {
            if (modKeys.hasOwnProperty(keyArray[i])) {
                hasModKey = true;
            } else if (alphabet.includes(keyArray[i])) {
                hasCodeKey = true;
            } else if (keyArray[i].length >= 2 && keyArray[i][0] === 'f') {
                hasFKey = true;
            }
        }
        return (hasModKey && hasCodeKey) || hasFKey;
    }

    return (
        <Box sx={{minWidth: 25, display: 'flex', flexDirection: 'row'}}>
            <TextField
                variant="outlined"
                value={keyListToString(isRecording ? Array.from(keys) : currentHotKey)}
                size="small"
                onBlur={stopRecordHotKey}
                onDoubleClick={startRecordHotKey}
                inputProps={{
                    readOnly: true,
                }}
                label="Double Click to Record"
                sx={{ input: {cursor: 'pointer'}, flexGrow: 1 }}
                error={!validKey() && checkValid}
            />
        </Box>
    );
}

function BindingTableRow(props) {
    const { rowData, isSelected, onSelectClick, onRowDataChange, onSave } = props;
    const [pathExist, setPathExist] = React.useState(true);

    exists(rowData.value).then((r) => {
        setPathExist(r);
    });

    function handleTypeChange(event) {
        let newRow = {
            id: rowData.id,
            key: rowData.key,
            b_type: event.target.value,
            value: rowData.value,
            enabled: rowData.enabled,
        }
        onRowDataChange(newRow);
        onSave(newRow);
    }

    function handleHotKeyChange(keys) {
        const newRow = JSON.parse(JSON.stringify(rowData));
        newRow.key = keys;
        onRowDataChange(newRow);
        onSave(newRow);
        return newRow;
    }

    function handleValueChange(newValue) {
        const newRow = JSON.parse(JSON.stringify(rowData));
        newRow.value = newValue;
        onRowDataChange(newRow);
        if (rowData.b_type === "Path") {
            exists(rowData.value).then((r) => {
                setPathExist(r);
            });
        }
        return newRow;
    }

    function handleEnableStatusChange(event) {
        const newRow = JSON.parse(JSON.stringify(rowData));
        newRow.enabled = event.target.checked;
        onRowDataChange(newRow);
        onSave(newRow);
        return newRow;
    }

    function handleValueDoubleClick() {
        exists(rowData.value).then((r) => {
            open({defaultPath: r ? rowData.value : undefined}).then((r) => {
                if (r) {
                    const newRow = handleValueChange(r);
                    onSave(newRow);
                }
            });
        });
    }

    function handleShellDoubleClick() {
        const defaultOptions = {
            filters: [
                {
                    name: 'Shell file',
                    extensions: ['sh'],
                }
            ]
        };

        function handleResult(r) {
            if (r) {
                const newRow = handleValueChange(r);
                onSave(newRow);
            }
        }

        exists(rowData.value).then((r) => {
            open({
                defaultPath: r ? rowData.value : undefined,
                ...defaultOptions
            }).then((r) => {
                handleResult(r);
            });
        }).catch(() => {
            open(defaultOptions).then((r) => {
                handleResult(r);
            });
        });
    }

    return (
        <TableRow
            hover
            key={rowData.id}
            sx={{
                ...(isSelected && {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity)
                }),
                transition: "all ease-in-out .3s"
            }}
        >
            <TableCell padding="checkbox" sx={{pl: 1}}>
                <Checkbox
                    color="primary"
                    checked={isSelected}
                    onChange={(event) => onSelectClick(event, rowData.id)}
                />
            </TableCell>

            <TableCell sx={{width: '20%'}}>
                <RecordHotKeyField
                    currentHotKey={rowData.key}
                    onHotKeyChange={handleHotKeyChange}
                    checkValid={rowData.b_type !== 'Map'}
                />
            </TableCell>

            <TableCell sx={{width: '15%'}}>
                <TypeSelect
                    currentType={rowData.b_type}
                    onTypeChange={handleTypeChange}
                />
            </TableCell>

            <TableCell sx={{flexGrow: 1}}>
                { rowData.b_type === 'Path' ? (
                    <TextField
                        error={!pathExist && rowData.value !== ""}
                        variant="outlined"
                        size="small"
                        value={rowData.value}
                        onChange={(event) => handleValueChange(event.target.value)}
                        onDoubleClick={handleValueDoubleClick}
                        onBlur={() => onSave(rowData)}
                        label="Double Click to Select or Click to Edit"
                        sx={{width: '100%'}}
                    />
                ) : rowData.b_type === 'Shell' ? (
                    <TextField
                        variant="outlined"
                        size="small"
                        value={rowData.value}
                        onChange={(event) => handleValueChange(event.target.value)}
                        onDoubleClick={handleShellDoubleClick}
                        onBlur={() => onSave(rowData)}
                        label="Double Click to Select or Shell Script to Run"
                        sx={{width: '100%'}}
                    />
                ) : rowData.b_type === 'Map' ? (
                    <RecordHotKeyField
                        currentHotKey={rowData.value.split('+')}
                        onHotKeyChange={(keys) => {
                            handleValueChange(keys.join('+'));
                            onSave(rowData);
                        }}
                        checkValid={false}
                    />
                ) : <Box></Box>}
            </TableCell>

            <TableCell sx={{width: '10%'}}>
                <Switch onChange={handleEnableStatusChange} checked={rowData.enabled}/>
            </TableCell>
        </TableRow>
    );
}

export default function BindingTable() {
    const [selected, setSelected] = React.useState([]);
    const [rows, setRows] = React.useState(rawRows);

    let activated = false;
    if (activated === false) {activateBindings(rows)}

    function activateBindings(bindings) {
        unregisterAll().then(() => {
            for (let i = 0; i < bindings.length; i += 1) {
                if (bindings[i].enabled) {
                    if (bindings[i].key.includes('meta')) {
                        bindings[i].key[bindings[i].key.indexOf('meta')] = 'command';
                    }

                    register(
                        bindings[i].key.join('+'),
                        () => {
                            invoke(Commands.openKey, {b: bindings[i]}).then(() => {});
                        }
                    ).then(() => {});
                }
            }
        });
        activated = true;
    }

    function handleSelectAllClick(event) {
        if (event.target.checked) {
            let r = [];
            for (let i = 0; i < rows.length; i ++) {
                r.push(rows[i].id);
            }
            setSelected(r);
        } else {
            setSelected([]);
        }
    }

    function handleSelectClick(event, id) {
        let newSelected = [];

        if (event.target.checked) {
            for (let i = 0; i < selected.length; i ++) {
                newSelected.push(selected[i]);
            }
            newSelected.push(id);
        } else {
            for (let i = 0; i < selected.length; i ++) {
                if (selected[i] !== id) {
                    newSelected.push(selected[i]);
                }
            }
        }

        setSelected(newSelected);
    }

    function handleRowDataChange(newRow) {
        let newRows = [];
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].id === newRow.id) {
                newRows.push(newRow);
            } else {
                newRows.push(rows[i]);
            }
        }
        setRows(newRows);
    }

    function handleDelete() {
        let newRows = [];
        for (let i = 0; i < rows.length; i ++) {
            if (!selected.includes(rows[i].id)) {
                newRows.push(rows[i]);
            }
        }
        setRows(newRows);
        setSelected([]);
        handleSave(newRows);
    }

    function handleNew() {
        let newRows = [{id: getUuid(), key: [], b_type: "Path", value: "", enabled: true}];
        for (let i = 0; i < rows.length; i++) {
            newRows.push(rows[i]);
        }
        setRows(newRows);
    }

    function handleSave(saveRows) {
        activateBindings(saveRows);
        invoke(Commands.setBindings, {newBindings: saveRows}).then(() => {});
    }

    function handleSaveRow(newRow) {
        let newRows = [];

        for (let i = 0; i < rows.length; i++) {
            if (rows[i].id === newRow.id) {
                newRows.push(newRow)
            } else {
                newRows.push(rows[i]);
            }
        }

        handleSave(newRows);
    }

    return (
        <Box sx={{width: "100%"}}>
            <BindingTableToolbar
                selectNum={selected.length}
                onDelete={handleDelete}
                onNew={handleNew}
            />
            {rows.length > 0 ? (
                <TableContainer>
                    <Table aria-labelledby="tableTitle">
                        <BindingTableHead
                            selected={selected}
                            rows={rows}
                            onSelectAllClick={handleSelectAllClick}
                        />
                        <TableBody>
                            {rows.map((row) => (
                                <BindingTableRow
                                    rowData={row}
                                    isSelected={selected.includes(row.id)}
                                    onSelectClick={handleSelectClick}
                                    onRowDataChange={handleRowDataChange}
                                    onSave={handleSaveRow}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography
                    component="div"
                    variant="body1"
                    sx={{
                        textAlign: 'center',
                        pt: 1
                    }}
                >
                    Add a new row to start using Key Open!
                </Typography>
            )}
        </Box>
    );
}
