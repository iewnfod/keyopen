import {alpha, Box, FormControl, IconButton, InputLabel, MenuItem, Select, TextField, Toolbar} from "@mui/material";
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

function getUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

const columns = [
    {
        key: 'key',
        name: 'Key',
    },
    {
        key: 'type',
        name: 'Type',
    },
    {
        key: 'value',
        name: 'Value',
    }
];

let rawRows = await invoke(Commands.getBindings);

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

            {
                selectNum > 0 ? (
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
                )
            }
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
                    <TableCell key={column.key}>
                        <Typography
                            variant="subtitle1"
                        >
                            {column.name}
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
        let newKeys = [];
        for (let i = 0; i < keyList.length; i++) {
            newKeys.push(keyList[i].charAt(0).toUpperCase() + keyList[i].slice(1));
        }
        return newKeys.join(' + ');
    }

    return (
        <Box sx={{minWidth: 25, display: 'flex', flexDirection: 'row'}}>
            <TextField
                variant="outlined"
                value={keyListToString(isRecording ? Array.from(keys) : currentHotKey)}
                size="small"
                inputProps={{
                    readOnly: true,
                }}
                sx={{ mr: 1 }}
            />
            {
                isRecording ? (
                    <IconButton onClick={stopRecordHotKey}>
                        <StopCircleIcon/>
                    </IconButton>
                ) : (
                    <IconButton onClick={startRecordHotKey}>
                        <EditIcon/>
                    </IconButton>
                )
            }
        </Box>
    );
}

function BindingTableRow(props) {
    const { rowData, isSelected, onSelectClick, onRowDataChange, onSave } = props;

    function handleTypeChange(event) {
        let newRow = {
            id: rowData.id,
            key: rowData.key,
            type: event.target.value,
            value: rowData.value
        }
        onRowDataChange(newRow);
        onSave(newRow);
    }

    function handleHotKeyChange(keys) {
        let newRow = {
            id: rowData.id,
            key: Array.from(keys),
            type: rowData.type,
            value: rowData.value
        };
        onRowDataChange(newRow);
        onSave(newRow);
    }

    function handleValueChange(event) {
        onRowDataChange({
            id: rowData.id,
            key: rowData.key,
            type: rowData.type,
            value: event.target.value
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
                <TextField
                    variant="outlined"
                    size="small"
                    value={rowData.value}
                    onChange={handleValueChange}
                    onBlur={onSave}
                    sx={{
                        width: '100%'
                    }}
                />
            </TableCell>
        </TableRow>
    );
}

export default function BindingTable() {
    const [selected, setSelected] = React.useState([]);
    const [rows, setRows] = React.useState(rawRows);

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
        let newRows = [{id: getUuid(), key: [], type: "Path", value: ""}];
        for (let i = 0; i < rows.length; i++) {
            newRows.push(rows[i]);
        }
        setRows(newRows);
    }

    function handleSave(saveRows) {
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
