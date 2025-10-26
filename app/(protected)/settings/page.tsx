import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DeleteAccountSection } from "@/components/dashboard/delete-account";
import { DashboardHeader } from "@/components/dashboard/header";
import { UserNameForm } from "@/components/forms/user-name-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobWebsiteIntegrationsSection } from "@/components/settings/job-website-integrations";
import { CalendarIntegrationsSection } from "@/components/settings/calendar-integrations";
import { OAuthCallbackHandler } from "@/components/settings/oauth-callback-handler";
import { Separator } from "@/components/ui/separator";

export const metadata = constructMetadata({
  title: "Settings – CruxHire AI",
  description: "Configure your account and website settings.",
});

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  const resolvedSearchParams = await searchParams;

  if (!user?.id) redirect("/login");

  // Extract OAuth callback parameters
  const success = resolvedSearchParams.success;
  const error = resolvedSearchParams.error;
  const provider = resolvedSearchParams.provider as string | undefined;

  return (
    <>
      <DashboardHeader
        heading="Settings"
        text="Manage account and website settings."
      />
      {/* Handle OAuth callback responses */}
      {(success || error) && provider && (
        <OAuthCallbackHandler 
          success={success !== undefined} 
          error={error as string | undefined} 
          provider={provider} 
        />
      )}
      <Tabs 
        defaultValue={resolvedSearchParams.tab as string || "account"} 
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="space-y-4">
          <div className="divide-y divide-muted pb-10">
            <UserNameForm user={{ id: user.id, name: user.name || "" }} />
            {/* <UserRoleForm user={{ id: user.id, role: user.role }} /> */}
            <DeleteAccountSection />
          </div>
        </TabsContent>
        <TabsContent value="integrations" className="space-y-8">
          <div>
            <h3 className="mb-1 text-lg font-medium">Job Platforms</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Connect to job platforms to post jobs and manage applications.
            </p>
            <JobWebsiteIntegrationsSection organizationId={user.organizationId} />
          </div>
          
          <Separator className="my-6" />
          
          <div>
            <h3 className="mb-1 text-lg font-medium">Calendar Integrations</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Connect your calendar to schedule interviews and manage appointments.
            </p>
            <CalendarIntegrationsSection organizationId={user.organizationId} />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
