import {Box, Button, Card, CardContent, CardMedia, Grid, IconButton, Link, Paper} from "@mui/material";
import Typography from "@mui/material/Typography";
import packageInfo from "../../package.json";
import logo from "../../src-tauri/icons/icon.svg";
import {invoke} from "@tauri-apps/api";
import commands from "../commands.js";

export default function ReleasePage() {
    function openGithub() {
        invoke(commands.openKey, {
            b: {
                id: "",
                key: [],
                b_type: "Path",
                value: packageInfo.url
            }
        }).then(() => {});
    }

    return (
        <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{position: 'absolute'}}
            style={{ minHeight: "99vh", left: 0, top: 0, width: '100vw' }}
        >
            <Grid xs={5}>
                <Box sx={{
                    mt: 5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    p: 2,
                    gap: 1
                }}>
                    <img src={logo} alt="" width="200px"/>
                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "flex-end",
                        gap: 1
                    }}>
                        <Typography component="div" variant="h5">
                            Key Open
                        </Typography>
                        <Typography component="div" variant="body1">
                            v{packageInfo.version}
                        </Typography>
                    </Box>
                    <Button onClick={openGithub}>
                        View More on Github
                    </Button>
                </Box>
            </Grid>
        </Grid>
    );
}
