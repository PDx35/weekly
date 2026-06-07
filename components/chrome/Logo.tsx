'use client';

import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";
/** FreshMart wordmark. `onClick` typically navigates home. */
export function Logo({ onClick }: { onClick?: () => void }) {
  return (


    < Link href={routes.home()} className="flex items-center gap-2 text-2xl font-bold tracking-tight" >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" x2="21" y1="6" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
      </span>
      <span>
        Grow<span className="text-emerald-600 font-extrabold">exy</span>
      </span>
    </Link >
  );
}
{/* <button className="logo" onClick={onClick} aria-label="FreshMart home">
      <Image src="/logo.png" alt="FreshMart" width={200} height={200}/>
    </button> */}