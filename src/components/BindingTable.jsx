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
import EditIcon from '@mui/icons-material/Edit';
import {useRecordHotkeys} from "react-hotkeys-hook";
import StopCircleIcon from '@mui/icons-material/StopCircle';
import Commands from "../commands.js";
import {register, unregisterAll} from "@tauri-apps/api/globalShortcut";
import {exists} from "@tauri-apps/api/fs";
import {open} from "@tauri-apps/api/dialog";

const columns = [
    'Key', 'Type', 'Value', 'Enabled'
];

let rawRows = await invoke(Commands.getBindings);

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
    const { currentHotKey, onHotKeyChange } = props;
    const [keys, { start, stop, isRecording }] = useRecordHotkeys();

    function startRecordHotKey() {
        start();
    }

    function stopRecordHotKey() {
        stop();
        if (keys.size) {
            onHotKeyChange(keys);
        }
    }

    function keyListToString(keyList) {
        let keyReplace = {
            alt: "⌥",
            meta: "⌘",
            command: "⌘",
            ctrl: "⌃",
            shift: "⇧",
            enter: "⏎",
            backspace: "⌫",
            escape: "⎋",
            tab: "⇥",
            space: "␣"
        };
        let newKeys = [];
        for (let i = 0; i < keyList.length; i++) {
            if (keyReplace.hasOwnProperty(keyList[i])) {
                newKeys.push(keyReplace[keyList[i]]);
            } else {
                newKeys.push(keyList[i].toUpperCase());
            }
        }
        return newKeys.join(' + ');
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
                sx={{ mr: 1 }}
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
        let newRow = {
            id: rowData.id,
            key: Array.from(keys),
            b_type: rowData.b_type,
            value: rowData.value,
            enabled: rowData.enabled,
        };
        onRowDataChange(newRow);
        onSave(newRow);
    }

    function handleValueChange(event) {
        onRowDataChange({
            id: rowData.id,
            key: rowData.key,
            b_type: rowData.b_type,
            value: event.target.value,
            enabled: rowData.enabled,
        });
        exists(rowData.value).then((r) => {
            setPathExist(r);
        });
    }

    function handleEnableStatusChange(event) {
        let newRow = {
            id: rowData.id,
            key: rowData.key,
            b_type: rowData.b_type,
            value: rowData.value,
            enabled: event.target.checked,
        };
        onRowDataChange(newRow);
        onSave(newRow);
    }

    function handleValueDoubleClick() {
        open().then((r) => {
            handleValueChange({target: {value: r}});
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
                />
            </TableCell>

            <TableCell sx={{width: '20%'}}>
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
                        onChange={handleValueChange}
                        onDoubleClick={rowData.b_type === 'Path' ? handleValueDoubleClick : () => {}}
                        onBlur={onSave}
                        label="Double Click to Select or Click to Edit"
                        sx={{width: '100%'}}
                    />
                ) : rowData.b_type === 'Shell' ? (
                    <TextField
                        variant="outlined"
                        size="small"
                        value={rowData.value}
                        onChange={handleValueChange}
                        onBlur={onSave}
                        sx={{width: '100%'}}
                    />
                ) : rowData.b_type === 'Map' ? (
                    <TextField
                        disabled
                        variant="outlined"
                        placeholder="Not Supported"
                        sx={{width: '100%'}}
                        size="small"
                    />
                ) : <Box></Box>}
            </TableCell>

            <TableCell>
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
