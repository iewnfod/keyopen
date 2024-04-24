import {useState} from "react";
import TitleMenu from "./components/TitleMenu.jsx";
import MainPage from "./components/MainPage.jsx";
import SettingPage from "./components/SettingPage.jsx";
import ReleasePage from "./components/ReleasePage.jsx";
import {Box, createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import {invoke} from "@tauri-apps/api";
import Commands from "./commands.js";

const rawSetting = await invoke(Commands.getSettings);

class Settings {
    dark_mode = false;
    start_at_login = false;
    hidden_mode = true;

    constructor() {
        this.dark_mode = rawSetting.dark_mode;
        this.start_at_login = rawSetting.start_at_login;
        this.hidden_mode = rawSetting.hidden_mode;
    }
}

export default function App() {
    const [pageNum, setPageNum] = useState(1);
    const [settings, setSettings] = useState(new Settings());

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

    function CurrentPage() {
        switch (pageNum) {
            case 1: return <MainPage/>;
            case 2: return <SettingPage settings={settings} onSettingChange={handleSettingChange}/>;
            case 3: return <ReleasePage/>;
        }
    }

    return (
        <ThemeProvider theme={
            createTheme({
                palette: {
                    mode: settings.dark_mode ? "dark" : "light",
                    background: {
                        default: settings.dark_mode ? '#2B2E31' : '#FFF'
                    }
                }
            })
        }>
            <CssBaseline/>
            <TitleMenu data-tauri-drag-region onPageChange={handlePageChange}/>
            <CurrentPage/>
        </ThemeProvider>
    );
}
