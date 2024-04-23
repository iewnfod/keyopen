import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import TitleMenu from "./components/TitleMenu.jsx";
import MainPage from "./components/MainPage.jsx";

export default function App() {
    return (
        <div className={"main"}>
            <TitleMenu/>

            <MainPage/>
        </div>
    );
}
