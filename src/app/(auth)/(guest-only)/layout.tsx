import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { createReadOnlyClient } from "@/lib/supabase/server";

export default async function GuestOnlyLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createReadOnlyClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims) {
    redirect("/");
  }

  return children;
}
