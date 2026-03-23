import { redirect } from "next/navigation";
import { getDefaultRedirectForRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/helpers";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(getDefaultRedirectForRole(user.role));
}
