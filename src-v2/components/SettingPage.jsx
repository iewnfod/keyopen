import {Box, Divider, FormControlLabel, FormGroup} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import SettingsIcon from '@mui/icons-material/Settings';
import TvIcon from '@mui/icons-material/Tv';

export default function SettingPage(props) {
    const {settings, onSettingChange} = props;

    function handleToggleSetting(event) {
        console.log(event.target.checked);
        onSettingChange(event.target.name, event.target.checked);
    }

    return (
        <Box padding={5}>
            <Typography variant="h5" sx={{display: "flex", justifyContent: "left", alignItems: "center", gap: 1}}>
                <SettingsIcon/>
                Settings
            </Typography>

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
                <TvIcon/>
                Display
            </Typography>

            <FormGroup sx={{mt: 2}}>
                <FormControlLabel
                    control={<Checkbox checked={settings.dark_mode}/>}
                    label="Dark Mode"
                    name="dark_mode"
                    onChange={handleToggleSetting}
                />
            </FormGroup>
        </Box>
    );
}
