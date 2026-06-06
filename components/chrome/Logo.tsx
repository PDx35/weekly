'use client';

import Image from "next/image";
/** FreshMart wordmark. `onClick` typically navigates home. */
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button className="logo" onClick={onClick} aria-label="FreshMart home">
      <Image src="/logo.png" alt="FreshMart" width={200} height={200}/>
    </button>
  );
}
