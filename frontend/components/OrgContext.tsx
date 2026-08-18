//frontend/components/OrgContext.tsx

"use client";

import { createContext, useContext } from "react";

interface OrgContextValue {
  orgId:     string;
  orgName:   string;
  orgSlug:   string;
  orgRole:   string;
  projectId: string;
  userId:    string;
  userName:  string;
  userEmail: string;
  userImage: string | null;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  value,
  children,
}: {
  value:    OrgContextValue;
  children: React.ReactNode;
}) {
  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg must be used within OrgProvider");
  }
  return ctx;
}