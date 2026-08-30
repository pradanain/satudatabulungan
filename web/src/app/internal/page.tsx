import Link from "next/link";
import { redirect } from "next/navigation";
import { InternalLoginForm } from "@/components/internal/internal-login-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOptionalInternalSession } from "@/lib/utils/internal-auth-server";
import { internalRoleLabels } from "@/lib/utils/internal-auth";

export default async function InternalLandingPage() {
  const session = await getOptionalInternalSession();

  if (session) {
    redirect("/internal/dashboard");
  }

  return (
    <div className="internal-page-bg flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        <InternalLoginForm />
      </div>
    </div>
  );
}


