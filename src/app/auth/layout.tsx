import Image from "next/image";
import Link from "next/link";
import { conBase } from "@/lib/base-path";

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12 sm:py-20">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mx-auto flex w-fit items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Image
            src={conBase("/brand/vesta-logo-alpha.png")}
            alt=""
            width={40}
            height={40}
            priority
            className="h-10 w-10"
          />
          <span className="font-heading text-2xl font-extrabold tracking-tight">
            VESTA
          </span>
        </Link>

        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
