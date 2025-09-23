
import * as React from "react"
import {
  useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "./ui/separator";
import smallLogo from '../assets/Sbin-small-logo.png'

export function AppLogo() {
  const { state } = useSidebar()

  return (
    <div className="transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8 h-10 flex items-start ml-2 justify-between flex-col">
      <div className="flex items-center justify-center gap-2">
        <img className="w-5.5" src={smallLogo} alt="App Logo" />
        <span className={` align-bottom transition-all duration-300 ${state !== 'expanded' ? 'opacity-0 w-0 h-0 overflow-hidden' : 'opacity-100 w-fit h-fit'} `}><span className=" text-[#59b542]">S</span>-Bin</span>
      </div>
      <Separator />
    </div>

  );
}
