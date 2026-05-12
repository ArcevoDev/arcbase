"use client";

import { useState } from "react";
import ResourceForm from "@/components/resources/ResourceForm";
import { useRouter } from "next/navigation";

export default function NewResourcePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: any) => {
    setSaving(true);

    try {
      // Replace with actual API call when ready
      console.log("Creating resource:", data);
      // Example: await fetch("/api/resources", { method: "POST", body: JSON.stringify(data) })

      // Navigate back to resource list after "saving"
      router.push("/resources");
    } catch (err) {
      console.error(err);
      alert("Failed to save resource.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create New Resource</h1>
      <ResourceForm onSubmit={handleSubmit} />
      {saving && <p className="text-sm text-muted-foreground">Saving...</p>}
    </div>
  );
}
