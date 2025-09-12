import { IoSettingsOutline } from "react-icons/io5";
import { CgMenuGridO } from "react-icons/cg";
import { FiSun, FiMoon } from "react-icons/fi";
import Button from "./Button";
import { useView } from "../contexts/toggleDarkMood";
import { Menu, MenuItem, Divider } from "@mui/material";

import { useState } from "react";


function HeaderNav() {
    const { isDark, toggleView } = useView()
    const [anchorEl, setAnchorEl] = useState(null);
    const handleClick = (event) => {
        setAnchorEl(anchorEl ? null : event.currentTarget)
    };
    return (
        <div className="bg-green-600 px-8 py-3 flex justify-between">
            <h1 className="text-xl font-bold">S-bin</h1>
            <div className="flex items-center gap-4">
                <Button onClick={toggleView} icon={isDark ? <FiSun /> : < FiMoon />} />
                <Button onClick={handleClick} icon={<CgMenuGridO />} />
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                >
                    <MenuItem onClick={() => setAnchorEl(null)}>
                        <IoSettingsOutline className="mr-2" /> Bins settings
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => setAnchorEl(null)}>
                        <IoSettingsOutline className="mr-2" /> Users settings
                    </MenuItem>
                </Menu>
            </div>
        </div>
    )
}

export default HeaderNav
