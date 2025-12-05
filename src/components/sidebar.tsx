"use client";

import React from "react";
import StaggeredMenu from "./StaggeredMenu";

const menuItems = [
  { label: "Home", ariaLabel: "Go to Home page", link: "/" },
  { label: "Energy", ariaLabel: "Go to Energy Monitoring page", link: "/energy" },
  { label: "Temperature", ariaLabel: "Go to Temperature Monitoring page", link: "/temperature" },
  { label: "Vibration", ariaLabel: "Go to Vibration Monitoring page", link: "/vibration" },
];

const socialItems = [
  { label: "Phone No.", link: "/" },
  { label: "Email", link: "nvcmti@gmail.com" },
  { label: "LinkedIn", link: "/" },
];

export default function Sidebar() {
  return (

      <StaggeredMenu
        position="left"
        isFixed={true}
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={false}
        menuButtonColor="#fff"
        openMenuButtonColor="#fff"
        changeMenuColorOnOpen={true}
        colors={["transparent", "transparent"]}// change if needed
        accentColor="#ff6b6b"
        onMenuOpen={() => console.log("Menu opened")}
        onMenuClose={() => console.log("Menu closed")}
      />

  );
}
