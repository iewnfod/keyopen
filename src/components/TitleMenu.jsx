import * as React from 'react';
import {alpha, styled, AppBar, Box, IconButton, Toolbar, Menu, MenuItem} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import SearchBox from "./SearchBox.jsx";

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

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar variant="dense" sx={{ flexDirection: "row-reverse", gap: 1 }}>
                    <IconMenu onPageChange={onPageChange}/>
                    <SearchBox/>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
