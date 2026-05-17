import { UserButton } from "@clerk/nextjs";

import { AppShell } from "@/components/app/app-shell";

export default function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell
      accountControl={<UserButton />}
      activeHref="/app"
      userLabel="Account"
    >
      {children}
    </AppShell>
  );
}
