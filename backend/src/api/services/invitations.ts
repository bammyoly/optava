import { query } from "../../lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/* ─────────────────────────────────────────────────────────── */
/*  Create invitation + send email                             */
/* ─────────────────────────────────────────────────────────── */

export async function createInvitation(input: {
  orgId:     string;
  email:     string;
  role:      string;
  invitedBy: string;
  orgName:   string;
  inviterName: string;
}) {
  // Check if already invited
  const existing = await query(
    `SELECT id, accepted_at FROM org_invitations
     WHERE org_id = $1 AND email = $2`,
    [input.orgId, input.email]
  );

  if (existing.rows.length > 0) {
    const inv = existing.rows[0];
    if (inv.accepted_at) {
      throw new Error("This email has already accepted an invitation");
    }
    throw new Error("An invitation has already been sent to this email");
  }

  // Check if user is already a member
  const userResult = await query(
    `SELECT u.id FROM users u
     JOIN org_members om ON om.user_id = u.id
     WHERE u.email = $1 AND om.org_id = $2`,
    [input.email, input.orgId]
  );

  if (userResult.rows.length > 0) {
    throw new Error("This user is already a member of the organization");
  }

  // Create invitation
  const result = await query(
    `INSERT INTO org_invitations (org_id, email, role, invited_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.orgId, input.email, input.role, input.invitedBy]
  );

  const invitation = result.rows[0];

  // Send email
  await sendInviteEmail({
    to:          input.email,
    token:       invitation.token,
    orgName:     input.orgName,
    inviterName: input.inviterName,
    role:        input.role,
  });

  return invitation;
}

/* ─────────────────────────────────────────────────────────── */
/*  Send invite email via Resend                               */
/* ─────────────────────────────────────────────────────────── */

async function sendInviteEmail(input: {
  to:          string;
  token:       string;
  orgName:     string;
  inviterName: string;
  role:        string;
}) {
  const inviteUrl = `${FRONTEND_URL}/invite/${input.token}`;

  await resend.emails.send({
    from:    "MemoryBoard <onboarding@resend.dev>",
    to:      input.to,
    subject: `Join ${input.orgName} on MemoryBoard`,
    html: `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 20px; font-weight: bold;">M</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; color: #0f1428; margin: 0;">MemoryBoard</h1>
        </div>

        <div style="background: #f8f9fc; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; text-align: center;">
          <h2 style="font-size: 20px; font-weight: 600; color: #0f1428; margin: 0 0 8px;">
            You've been invited
          </h2>
          <p style="font-size: 15px; color: #6b7280; margin: 0 0 24px; line-height: 1.5;">
            <strong style="color: #0f1428;">${input.inviterName}</strong> invited you to join
            <strong style="color: #0f1428;">${input.orgName}</strong> as a <strong>${input.role}</strong>.
          </p>

          <a href="${inviteUrl}"
             style="display: inline-block; background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); color: white; font-size: 15px; font-weight: 600; padding: 12px 32px; border-radius: 10px; text-decoration: none;">
            Accept Invitation
          </a>

          <p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0; line-height: 1.5;">
            This invitation expires in 7 days.<br/>
            If you didn't expect this, ignore this email.
          </p>
        </div>

        <p style="font-size: 12px; color: #d1d5db; text-align: center; margin-top: 32px;">
          MemoryBoard — AI Project Manager with Persistent Memory
        </p>
      </div>
    `,
  });

  console.log(`[invitations] Invite email sent to ${input.to}`);
}

/* ─────────────────────────────────────────────────────────── */
/*  Get invitation by token                                    */
/* ─────────────────────────────────────────────────────────── */

export async function getInvitationByToken(token: string) {
  const result = await query(
    `SELECT
       i.*,
       o.name AS org_name,
       o.slug AS org_slug,
       u.name AS inviter_name
     FROM org_invitations i
     JOIN organizations o ON o.id = i.org_id
     LEFT JOIN users u ON u.id = i.invited_by
     WHERE i.token = $1`,
    [token]
  );
  return result.rows[0] || null;
}

/* ─────────────────────────────────────────────────────────── */
/*  Accept invitation                                          */
/* ─────────────────────────────────────────────────────────── */

export async function acceptInvitation(
  token:     string,
  userId:    string,
  userEmail: string
) {
  // Get the invitation
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.accepted_at) {
    throw new Error("This invitation has already been accepted");
  }

  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error("This invitation has expired");
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error("This invitation was sent to a different email address");
  }

  // Add user as org member
  await query(
    `INSERT INTO org_members (org_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (org_id, user_id) DO NOTHING`,
    [invitation.org_id, userId, invitation.role]
  );

  // Mark invitation as accepted
  await query(
    `UPDATE org_invitations SET accepted_at = now()
     WHERE id = $1`,
    [invitation.id]
  );

  return invitation;
}

/* ─────────────────────────────────────────────────────────── */
/*  List invitations for an org                                */
/* ─────────────────────────────────────────────────────────── */

export async function listInvitations(orgId: string) {
  const result = await query(
    `SELECT
       i.*,
       u.name AS inviter_name
     FROM org_invitations i
     LEFT JOIN users u ON u.id = i.invited_by
     WHERE i.org_id = $1
     ORDER BY i.created_at DESC`,
    [orgId]
  );
  return result.rows;
}

/* ─────────────────────────────────────────────────────────── */
/*  Revoke invitation                                          */
/* ─────────────────────────────────────────────────────────── */

export async function revokeInvitation(id: string) {
  await query(
    `DELETE FROM org_invitations WHERE id = $1`,
    [id]
  );
}