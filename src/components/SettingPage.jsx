import {Box, Button, Divider, FormControlLabel, FormGroup, TextField, Toolbar} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import SettingsIcon from '@mui/icons-material/Settings';
import LoopIcon from '@mui/icons-material/Loop';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import TuneIcon from '@mui/icons-material/Tune';
import React from "react";
import {invoke} from "@tauri-apps/api";
import Commands from "../commands.js";
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';

function isValidColor(color) {
    let type='';
    if(/^rgb\(/.test(color)){
        //如果是rgb开头，200-249，250-255，0-199
        type = "^[rR][gG][Bb][\(]([\\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?)[\\s]*,){2}[\\s]*(2[0-4]\\d|25[0-5]|[01]?\\d\\d?)[\\s]*[\)]{1}$";
    } else if (/^rgba\(/.test(color)){
        //如果是rgba开头，判断0-255:200-249，250-255，0-199 判断0-1：0 1 1.0 0.0-0.9
        type = "^[rR][gG][Bb][Aa][\(]([\\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?)[\\s]*,){3}[\\s]*(1|1.0|0|0.[0-9])[\\s]*[\)]{1}$";
    } else if (/^#/.test(color)){
        //六位或者三位
        type = "^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$"
    } else if (/^hsl\(/.test(color)){
        //判断0-360 判断0-100%(0可以没有百分号)
        type = "^[hH][Ss][Ll][\(]([\\s]*(2[0-9][0-9]|360｜3[0-5][0-9]|[01]?[0-9][0-9]?)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*)[\)]$";
    } else if (/^hsla\(/.test(color)){
        type = "^[hH][Ss][Ll][Aa][\(]([\\s]*(2[0-9][0-9]|360｜3[0-5][0-9]|[01]?[0-9][0-9]?)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*,){2}([\\s]*(1|1.0|0|0.[0-9])[\\s]*)[\)]$";
    }
    let re = new RegExp(type);
    return color.match(re) !== null && color;
}

export default function SettingPage(props) {
    const {settings, onSettingChange, onReset} = props;

    const [themeColor, setThemeColor] = React.useState(settings.theme_color);
    const [mapDelayTime, setMapDelayTime] = React.useState(settings.map_delay_time);

    const possibleThemeColors = ["#5A63BF", "#7966A7", "#C05D8E", "#B15927", "#9F3E3B", "#5C8D67"];

    function handleToggleSetting(event) {
        onSettingChange(event.target.name, event.target.checked);
    }

    function handleNumberInputSetting(event) {
        onSettingChange(event.target.name, event.target.valueAsNumber);
    }

    function saveThemeColor(color) {
        onSettingChange('theme_color', color);
    }

    function handleGetAccessibility() {
        invoke(Commands.requestAccessibility).then();
    }

    return (
        <Box>
            <Toolbar sx={{mt: 2, ml: 1}}>
                <Typography
                    variant="h5"
                    sx={{display: "flex", justifyContent: "left", alignItems: "center", gap: 1, flex: '1 1 100%'}}
                    component="div"
                    color="inherit"
                >
                    <SettingsIcon/>
                    Settings
                </Typography>

                <Button sx={{gap: 1, pl: 2, pr: 2}} onClick={onReset}>
                    Reset
                    <LoopIcon/>
                </Button>
            </Toolbar>

            <Box sx={{pl: 4, pr: 5, mb: 5}}>
                <FormGroup sx={{mt: 2}}>
                    <FormControlLabel
                        control={<Checkbox checked={settings.start_at_login}/>}
                        label="Start at Login"
                        name="start_at_login"
                        onChange={handleToggleSetting}
                    />
                    <FormControlLabel
                        control={<Checkbox checked={settings.hidden_mode}/>}
                        label="Hidden Mode (Hide this window when open the app)"
                        name="hidden_mode"
                        onChange={handleToggleSetting}
                    />
                </FormGroup>

                <Divider sx={{mt: 4, mb: 4}}/>

                <Typography variant="h5" sx={{display: "flex", justifyContent: "left", alignItems: "center", gap: 1}}>
                    <DisplaySettingsIcon/>
                    Display
                </Typography>

                <FormGroup sx={{mt: 2}}>
                    <Box sx={{mb: 1, display: "flex", justifyContent: "left", alignItems: "center", gap: 2}}>
                        <Typography>Theme Color</Typography>
                        <Box sx={{display: "flex", justifyContent: "left", alignItems: "center", gap: 0}}>
                            {
                                possibleThemeColors.map((color, i) => (
                                    <Checkbox
                                        key={i}
                                        checked={color === themeColor}
                                        sx={{color: color}}
                                        onClick={() => saveThemeColor(color)}
                                        icon={<IndeterminateCheckBoxIcon color={color}/>}
                                    />
                                ))
                            }
                        </Box>
                    </Box>
                    <FormControlLabel
                        control={<Checkbox checked={settings.dark_mode}/>}
                        label="Dark Mode"
                        name="dark_mode"
                        onChange={handleToggleSetting}
                    />
                </FormGroup>

                <Divider sx={{mt: 4, mb: 4}}/>

                <Typography variant="h5" sx={{display: "flex", justifyContent: "left", alignItems: "center", gap: 1}}>
                    <TuneIcon/>
                    Advanced
                </Typography>

                <FormGroup sx={{mt: 2}}>
                    <Box sx={{mb: 2, display: "flex", justifyContent: "left", alignItems: "center", gap: 2}}>
                        <Typography>Map Key Delay Time (ms)</Typography>
                        <TextField
                            size="small"
                            placeholder={settings.map_delay_time}
                            type="number"
                            value={mapDelayTime}
                            name="map_delay_time"
                            onChange={
                                (event) => {
                                    if (!isNaN(event.target.valueAsNumber) && event.target.valueAsNumber >= 0) {
                                        setMapDelayTime(Math.trunc(event.target.valueAsNumber));
                                    }
                                }
                            }
                            onBlur={handleNumberInputSetting}
                        />
                    </Box>
                </FormGroup>
            </Box>
        </Box>
    );
}
