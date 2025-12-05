import React from "react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="container w-full border-t border-[#33353F] text-white">
      <div className="max-w mx-auto p-5 flex justify-between items-center">
        
        {/* LOGOS SIDE BY SIDE */}
        <div className="flex items-center gap-5">
<div className="relative w-[100px] h-[100px] group">
  {/* Base white logo */}
  <Image
    src="/logos/cmtilogowhite.png"
    alt="Logo 1 white"
    fill
    className="object-contain opacity-50 group-hover:opacity-0 transition-opacity duration-300"
  />

  {/* Blue logo on top, hidden until hover */}
  <Image
    src="/logos/cmtilogoblue.png"
    alt="Logo 1 Blue"
    fill
    className="object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-300"
  />
</div>
<div className="relative w-[165px] h-[165px] group">
  {/* Base white logo */}
  <Image
    src="/logos/MHILogowhite.png"
    alt="Logo 2 white"
    fill
    className="object-contain opacity-50 group-hover:opacity-0 transition-opacity duration-300"
  />

  {/* Blue logo on top, hidden until hover */}
  <Image
    src="/logos/MHILogogold.png"
    alt="Logo 2 gold"
    fill
    className="object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-300"
  />
</div>


        </div>

        <p className="text-slate-500">© 2025 All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
