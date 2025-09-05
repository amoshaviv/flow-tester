import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface InviteEmailData {
  inviteToken: string;
  organizationName: string;
  organizationDomain: string;
  invitedByName: string;
  invitedByEmail: string;
  role: string;
}

export const sendInviteEmail = async (
  toEmail: string,
  data: InviteEmailData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${data.inviteToken}`;

    const roleLabel = {
      owner: "Owner",
      admin: "Admin", 
      user: "User",
      tester: "Tester",
    }[data.role] || data.role;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to join ${data.organizationName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #1976d2;
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .invite-button {
            display: inline-block;
            background: #1976d2;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .details {
            background: white;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #1976d2;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>You're Invited!</h1>
        <p>Join ${data.organizationName} on FlowTester</p>
    </div>
    
    <div class="content">
        <p>Hi there!</p>
        
        <p><strong>${data.invitedByName}</strong> (${data.invitedByEmail}) has invited you to join <strong>${data.organizationName}</strong> as a <strong>${roleLabel}</strong>.</p>
        
        <div class="details">
            <h3>Organization Details</h3>
            <p><strong>Name:</strong> ${data.organizationName}</p>
            <p><strong>Domain:</strong> ${data.organizationDomain}</p>
            <p><strong>Your Role:</strong> ${roleLabel}</p>
        </div>
        
        <p>Click the button below to accept the invitation and create your account:</p>
        
        <div style="text-align: center;">
            <a href="${inviteUrl}" class="invite-button">Accept Invitation</a>
        </div>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${inviteUrl}
        </p>
        
        <div class="footer">
            <p>This invitation will expire in 7 days. If you don't want to join this organization, you can safely ignore this email.</p>
            <p>FlowTester - Automated Testing Platform</p>
        </div>
    </div>
</body>
</html>
    `;

    const textContent = `
You're invited to join ${data.organizationName}!

Hi there!

${data.invitedByName} (${data.invitedByEmail}) has invited you to join ${data.organizationName} as a ${roleLabel}.

Organization Details:
- Name: ${data.organizationName}
- Domain: ${data.organizationDomain}
- Your Role: ${roleLabel}

To accept this invitation and create your account, visit:
${inviteUrl}

This invitation will expire in 7 days. If you don't want to join this organization, you can safely ignore this email.

FlowTester - Automated Testing Platform
    `;

    const command = new SendEmailCommand({
      Source: process.env.EMAIL_FROM || "noreply@flowtester.com",
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: `Invitation to join ${data.organizationName}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: "UTF-8",
          },
          Text: {
            Data: textContent,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Failed to send invite email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send email" 
    };
  }
};