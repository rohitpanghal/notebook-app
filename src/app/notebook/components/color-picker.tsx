"use client"; // Ensure this is a client component

import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useState } from "react";

const CompactPicker = dynamic(() => import("react-color/lib/components/compact/Compact"), { ssr: false });

export default function ColorPickerComponent(props:any) {
    const {changeSelectedTextColor,getSelectedColor} = props;
    const { resolvedTheme } = useTheme();
  const [color, setColor] = useState("#ff0000");
  const pickerStyles = {
    default: {
      Compact: {
        backgroundColor: resolvedTheme === "dark" ? "#222" : "#f0f0f0", // Adapt based on resolved theme
        borderRadius: "8px",
        padding: "8px",
        background: resolvedTheme === "dark" ? "#222" : "#f0f0f0", 
      },
    },
  };
  return (
    <div>
     <CompactPicker
                   color={color}
                   onChange={(updatedColor) => {
                     setColor(updatedColor.hex); // Update color state
                     getSelectedColor(updatedColor.hex)
                     changeSelectedTextColor(updatedColor.hex); // Apply color immediately
                   }}
                   className={resolvedTheme}
                   styles={pickerStyles} // Apply theme-based styles
                 />
     
    </div>
  );
}
