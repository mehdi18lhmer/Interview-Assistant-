import Link from "next/link";
export const dynamic = "force-dynamic";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  let isUserAuthenticated = false;

  try {
    isUserAuthenticated = await isAuthenticated();
  } catch (error) {
    console.error("Authentication check failed in Layout:", error);
    // Be conservative: if auth check fails, treat as not authenticated
    isUserAuthenticated = false;
  }

  if (!isUserAuthenticated) redirect("/sign-in");

  return (
    <div className="root-layout">
      <nav className="flex justify-between items-center w-full">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="MockMate Logo" width={38} height={32} />
          <h2 className="text-primary-100">PrepWise</h2>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/profile" className="text-light-100 hover:text-primary-200 transition-colors font-medium">
            Profile
          </Link>
        </div>
      </nav>

      {children}
    </div>
  );
};

export default Layout;
