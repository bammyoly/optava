//frontend/hooks/useapi

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getProjectId, type SourceType } from "@/lib/api";
import { useOrg } from "@/components/OrgContext";

/* ─────────────────────────────────────────────────────────── */
/*  Helper — get projectId from context                        */
/* ─────────────────────────────────────────────────────────── */

function useProjectId(): string {
  const org = useOrg();
  return org.projectId;
}

/* ─────────────────────────────────────────────────────────── */
/*  Projects                                                   */
/* ─────────────────────────────────────────────────────────── */

export function useProject() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ["project", projectId],
    queryFn:  () => api.projects.get(projectId),
  });
}

export function useProjectStats() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ["projectStats", projectId],
    queryFn:  () => api.projects.getStats(projectId),
    refetchInterval: 30_000,
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Decisions                                                  */
/* ─────────────────────────────────────────────────────────── */

export function useDecisions(category?: string) {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ["decisions", projectId, category],
    queryFn:  () => api.decisions.list(projectId, category),
  });
}

export function useCreateDecision() {
  const qc        = useQueryClient();
  const projectId = useProjectId();

  return useMutation({
    mutationFn: (input: {
      title:        string;
      context:      string;
      rationale:    string;
      alternatives: string[];
      category?:    string;
      author?:      string;
    }) =>
      api.decisions.create({
        project_id: projectId,
        ...input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      qc.invalidateQueries({ queryKey: ["projectStats"] });
    },
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Tasks                                                      */
/* ─────────────────────────────────────────────────────────── */

export function useTasks(status?: string) {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ["tasks", projectId, status],
    queryFn:  () => api.tasks.list(projectId, status),
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Notes                                                      */
/* ─────────────────────────────────────────────────────────── */

export function useNotes() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ["notes", projectId],
    queryFn:  () => api.notes.list(projectId),
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Standups                                                   */
/* ─────────────────────────────────────────────────────────── */

export function useStandups() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ["standups", projectId],
    queryFn:  () => api.standups.list(projectId),
  });
}

export function useGenerateStandup() {
  const qc        = useQueryClient();
  const projectId = useProjectId();

  return useMutation({
    mutationFn: () =>
      api.standups.generate(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["standups"] });
    },
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Search                                                     */
/* ─────────────────────────────────────────────────────────── */

export function useSearch() {
  const projectId = useProjectId();

  return useMutation({
    mutationFn: (input: {
      query:         string;
      limit?:        number;
      sourceTypes?:  SourceType[];
    }) =>
      api.search.query({
        projectId,
        ...input,
      }),
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Chat                                                       */
/* ─────────────────────────────────────────────────────────── */

export function useChat() {
  const qc        = useQueryClient();
  const projectId = useProjectId();

  return useMutation({
    mutationFn: (input: {
      sessionId?: string;
      message:    string;
      history?:   Array<{ role: "user" | "assistant"; content: string }>;
    }) =>
      api.chat.send({
        projectId,
        ...input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projectStats"] });
      qc.invalidateQueries({ queryKey: ["chatSessions"] });
    },
  });
}

export function useChatSessions() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ["chatSessions", projectId],
    queryFn:  () => api.conversations.listSessions(projectId),
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Team                                                       */
/* ─────────────────────────────────────────────────────────── */

export function useTeam() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ["team", projectId],
    queryFn:  () => api.team.list(projectId),
  });
}

export function useTeamMember(id?: string) {
  return useQuery({
    queryKey: ["teamMember", id],
    queryFn:  () => api.team.get(id!),
    enabled:  !!id,
  });
}

export function useCreateTeamMember() {
  const qc        = useQueryClient();
  const projectId = useProjectId();

  return useMutation({
    mutationFn: (input: { name: string; role?: string; avatar_color?: string }) =>
      api.team.create({
        project_id: projectId,
        ...input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Org Members                                                */
/* ─────────────────────────────────────────────────────────── */

export function useOrgMembers() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["orgMembers", orgId],
    queryFn:  () => api.orgMembers.list(orgId),
  });
}

export function useInviteMember() {
  const qc         = useQueryClient();
  const { orgId, userId } = useOrg();

  return useMutation({
    mutationFn: (input: { email: string; role: string }) =>
      api.orgMembers.invite({
        orgId,
        invitedBy: userId,
        ...input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgMembers"] });
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useInvitations() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ["invitations", orgId],
    queryFn:  () => api.invitations.list(orgId),
  });
}