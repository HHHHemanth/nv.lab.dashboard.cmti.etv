import React from "react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="container w-full border-t border-[#33353F] text-white">
      <div className="max-w mx-auto p-5 flex justify-between items-center">
        
        {/* LOGOS SIDE BY SIDE */}
        <div className="flex items-center gap-5">
          <Image
            src="/logos/logocmti.png"
            alt="Logo 1"
            width={100}
            height={100}
            className="opacity-50 hover:opacity-100 transition"
          />

          <Image
            src="/logos/MHILogo.png"
            alt="Logo 2"
            width={130}
            height={130}
            className="opacity-50 hover:opacity-100 transition"
          />
        </div>

        <p className="text-slate-600">© 2025 All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
