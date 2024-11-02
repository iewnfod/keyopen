import React, {useEffect, useState} from 'react';
import {AppBar, Box, IconButton, Toolbar, Menu, MenuItem, Button} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import {appWindow} from "@tauri-apps/api/window";
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

function IconMenu(props) {
    const {onPageChange} = props;

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    function handleClick(event) {
        setAnchorEl(event.currentTarget);
    }

    function handlePageChange(event) {
        onPageChange(event);
        handleClose();
    }

    function handleClose() {
        setAnchorEl(null);
    }

    return (
        <div>
            <IconButton
                edge="end"
                color="inherit"
                id="icon-menu-bt"
                aria-label="menu"
                aria-controls={open ? 'icon-menu-body' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                <MenuIcon/>
            </IconButton>
            <Menu
                id="icon-menu-body"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'icon-menu-bt',
                }}
            >
                <MenuItem value={1} onClick={handlePageChange}>Main Page</MenuItem>
                <MenuItem value={2} onClick={handlePageChange}>Settings</MenuItem>
                <MenuItem value={3} onClick={handlePageChange}>Release Info</MenuItem>
            </Menu>
        </div>
    );
}

export default function TitleMenu(props) {
    const {onPageChange} = props;
    const [inFullScreen, setInFullScreen] = useState(false);

    useEffect(() => {
        appWindow.isFullscreen().then((res) => {
            setInFullScreen(res);
        }).catch();
    }, []);

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar component="nav">
                <Toolbar data-tauri-drag-region variant="dense" sx={{ gap: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Box sx={{ml: -2}}>
                        <IconButton
                            color="inherit"
                            onClick={() => {
                                appWindow.hide().then().catch();
                            }}
                        >
                            <CloseIcon/>
                        </IconButton>
                        <IconButton
                            color="inherit"
                            onClick={() => {
                                appWindow.setFullscreen(!inFullScreen).then(() => {
                                    appWindow.isFullscreen().then((res) => {
                                        setInFullScreen(res);
                                    }).catch();
                                }).catch();
                            }}
                        >
                            {
                                inFullScreen ? <FullscreenExitIcon/> : <FullscreenIcon/>
                            }
                        </IconButton>
                        <IconButton
                            color="inherit"
                            onClick={() => {
                                appWindow.minimize().then().catch();
                            }}
                        >
                            <MinimizeIcon/>
                        </IconButton>
                    </Box>
                    <IconMenu onPageChange={onPageChange}/>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
