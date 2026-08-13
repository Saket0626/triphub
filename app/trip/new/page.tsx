/** Trip intake wizard — Trip Basics → Travelers → Flight Preferences → Review Basics. */

import { PageShell } from "@/components/site-header";
import { IntakeWizard } from "@/components/wizard/intake-wizard";

export default function NewTripPage() {
  return (
    <PageShell>
      <IntakeWizard />
    </PageShell>
  );
}
