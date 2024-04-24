import * as React from 'react';
import {alpha, styled, AppBar, Box, IconButton, Toolbar, Menu, MenuItem} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import SearchBox from "./SearchBox.jsx";

const IconMenu = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

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
                <MenuItem onClick={handleClose}>Main Page</MenuItem>
                <MenuItem onClick={handleClose}>Settings</MenuItem>
                <MenuItem onClick={handleClose}>Release Info</MenuItem>
            </Menu>
        </div>
    );
}

export default function TitleMenu() {
    return (
        <Box data-tauri-drag-region sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar variant="dense" sx={{ flexDirection: "row-reverse", gap: 1 }}>
                    <IconMenu/>
                    <div>
                        <SearchBox/>
                    </div>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
