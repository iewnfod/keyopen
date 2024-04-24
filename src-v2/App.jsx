import "./App.css";
import TitleMenu from "./components/TitleMenu.jsx";
import MainPage from "./components/MainPage.jsx";
import {useState} from "react";
import SettingPage from "./components/SettingPage.jsx";

export default function App() {
    const [pageNum, setPageNum] = useState(1);

    function handlePageChange(event) {
        setPageNum(event.target.value);
    }

    function CurrentPage() {
        switch (pageNum) {
            case 1: return <MainPage/>;
            case 2: return <SettingPage/>;
        }
    }

    return (
        <div className={"main"}>
            <TitleMenu onPageChange={handlePageChange}/>
            <CurrentPage/>
        </div>
    );
}
