import {useEffect, useState} from "react";
import TitleMenu from "./components/TitleMenu.jsx";
import MainPage from "./components/MainPage.jsx";
import SettingPage from "./components/SettingPage.jsx";
import ReleasePage from "./components/ReleasePage.jsx";
import {Box, createTheme, CssBaseline, ThemeProvider, useTheme} from "@mui/material";
import {invoke} from "@tauri-apps/api";
import Commands from "./commands.js";
import {Toaster} from "react-hot-toast";

const rawSetting = await invoke(Commands.getSettings);

export class Settings {
    dark_mode = false;
    start_at_login = false;
    hidden_mode = true;
    theme_color = "#5A63BF";
    map_delay_time = 100;

    loadRaw() {
        Object.keys(rawSetting).map((key) => {
            this[key] = rawSetting[key];
        });
        return this;
    }
}

export default function App() {
    const [pageNum, setPageNum] = useState(1);
    const [settings, setSettings] = useState(new Settings().loadRaw());

    let theme = defaultTheme();

    useEffect(() => {
        theme = defaultTheme();
    }, [settings]);

    function defaultTheme() {
        return createTheme({
            palette: {
                mode: settings.dark_mode ? "dark" : "light",
                background: {
                    default: settings.dark_mode ? '#2B2E31' : '#FFF'
                },
                primary: {
                    main: settings.theme_color.toLowerCase()
                }
            }
        });
    }

    function handlePageChange(event) {
        setPageNum(event.target.value);
    }

    function handleSettingChange(settingName, newValue) {
        let newSetting = {};

        for (const [key, value] of Object.entries(settings)) {
            if (key === settingName) {
                newSetting[key] = newValue;
            } else {
                newSetting[key] = value;
            }
        }

        invoke(Commands.setSettings, {newSettings: newSetting}).then(() => {
            setSettings(newSetting);
        });
    }

    function handleReset() {
        let newSetting = new Settings();
        setSettings(newSetting);
    }

    function CurrentPage() {
        switch (pageNum) {
            case 1: return <MainPage/>;
            case 2: return <SettingPage
                settings={settings}
                onSettingChange={handleSettingChange}
                onReset={handleReset}
            />;
            case 3: return <ReleasePage/>;
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>

            <Box>
                <TitleMenu onPageChange={handlePageChange} occupyPos={false}/>

                <Toaster/>

                <Box mt={6.25}>
                    <CurrentPage/>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
