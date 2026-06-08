'use client';

import Link from "next/link";
import { routes } from "@/lib/routes";

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href={routes.home()} className="flex items-center" onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="/logo.png" 
        alt="Store Logo" 
        className="h-10 md:h-12 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105 active:scale-95" 
      />
    </Link>
  );
}