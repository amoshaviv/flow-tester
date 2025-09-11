import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthOptions, getServerSession } from "next-auth";
import { getDBModels } from "@/lib/sequelize";
import { capitalCase } from "change-case";
import { cookies } from "next/headers";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { IOrganizationInstance } from "../sequelize/models/organization";
import { IUserInstance } from "../sequelize/models/user";

const sqsClient = new SQSClient({ region: "us-west-2" });
const QUEUE_URL =
  "https://sqs.us-west-2.amazonaws.com/746664778706/flow-tester-test-runs-queue";

type OrganizationInfo = { domain: string; name: string };
function getOrganizationInfoFromEmail(
  email: string,
  fullName: string
): OrganizationInfo {
  const commonProviders = [
    "gmail",
    "yahoo",
    "hotmail",
    "outlook",
    "icloud",
    "aol",
    "protonmail",
    "msn",
    "live",
    "ymail",
    "mail",
    "zoho",
    "gmx",
    "me",
    "comcast",
    "verizon",
    "att",
    "sbcglobal",
    "cox",
    "charter",
    "rocketmail",
    "mail",
    "yandex",
    "qq",
    "naver",
    "163",
    "126",
    "yeah",
    "googlemail",
  ];
  const domainPart = email.split("@")[1];
  const nakedDomain = domainPart.split(".")[0];
  if (commonProviders.includes(nakedDomain)) {
    return {
      name: fullName,
      domain: email.replace("@", "."),
    };
  } else {
    return {
      name: capitalCase(nakedDomain),
      domain: domainPart,
    };
  }
}

async function handleInviteSignup(credentials: any, dbModels: any) {
  const { User, Organization, Invite } = dbModels;
  const cookieStore = await cookies();

  // Find and validate the invite
  const invite = await Invite.findByToken(credentials.inviteToken);

  if (!invite) {
    throw new Error("Invalid or expired invitation");
  }

  if (invite.isExpired()) {
    throw new Error("This invitation has expired");
  }

  // Verify email matches invite
  if (invite.email !== credentials.email) {
    throw new Error("Email doesn't match invitation");
  }

  // Check if user already exists
  const existingUser = await User.findByEmail(invite.email);
  if (existingUser) {
    throw new Error("A user with this email address already exists");
  }

  // Create the user (password will be hashed in the model)
  const newUser = await User.create({
    email: invite.email,
    displayName: credentials.displayName,
    password: credentials.password,
    provider: "credentials",
    providerId: credentials.email,
  });

  // Get the organization from the invite
  const organization = await invite.getOrganization();

  // Add user to organization with the invited role
  await Organization.addUserToOrganization(organization, newUser, invite.role);

  // Mark invite as used
  await invite.markAsUsed();

  // Set cookies for redirect
  cookieStore.set("lastOrganization", organization.slug);
  const projects = await organization.getProjects();
  if (projects.length > 0) {
    cookieStore.set("lastProject", projects[0].slug);
  }

  return {
    id: newUser.id.toString(),
    email: newUser.email,
    displayName: newUser.displayName,
    profileImageURL: newUser.profileImageURL,
  };
}

async function createAnalysisQueueMessage(
  user: IUserInstance,
  organization: IOrganizationInstance
) {
  try {
    const message = {
      taskType: "website-analysis",
      userId: user.id,
      organizationDomain: organization.domain,
      organizationSlug: organization.slug,
      organizationId: organization.id,
      modelSlug: "gemini-2.5-flash",
      modelProvider: "Google",
    };

    const command = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(message),
    });

    await sqsClient.send(command);
  } catch (sqsError) {
    console.error("Failed to send SQS message:", sqsError);
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        displayName: { label: "Name", type: "displayName" },
        password: { label: "Password", type: "password" },
        inviteToken: { label: "Invite Token", type: "text", optional: true },
      },
      async authorize(credentials, req) {
        const dbModels = await getDBModels();
        const { User, Organization, Project, Invite } = dbModels;
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Handle invite signup flow
        if (credentials.inviteToken && credentials.displayName) {
          return await handleInviteSignup(credentials, dbModels);
        }

        const user = await User.findByEmail(credentials.email);
        const cookieStore = await cookies();

        if (!user) {
          if (!credentials?.displayName) throw new Error("Invalid credentials");
          const newUser = await User.create({
            email: credentials.email,
            password: credentials.password,
            displayName: credentials.displayName,
            provider: "credentials",
            providerId: credentials.email,
          });

          try {
            const organizationInformation = getOrganizationInfoFromEmail(
              credentials.email,
              credentials.displayName
            );

            const defaultOrganization = await Organization.createWithUser(
              organizationInformation.name,
              organizationInformation.domain,
              newUser
            );

            createAnalysisQueueMessage(newUser, defaultOrganization);

            const defaultProject = await Project.createWithOrganization(
              `Default Project`,
              newUser,
              defaultOrganization
            );

            // Save redirect URL as a cookie
            cookieStore.set("lastOrganization", defaultOrganization.slug);
            cookieStore.set("lastProject", defaultProject.slug);

            return {
              id: newUser.id.toString(),
              email: newUser.email,
              displayName: newUser.displayName,
              profileImageURL: newUser.profileImageURL,
            };
          } catch (err) {
            console.log(err);
            throw new Error("Invalid credentials");
          }
        }

        if (!user.authenticate(credentials.password)) {
          throw new Error("Invalid credentials");
        }

        const organizations = await user.getOrganizations({
          include: [
            {
              association: "projects",
              attributes: ["name", "slug"],
            },
          ],
        });
        cookieStore.set("lastOrganization", organizations[0].slug);
        cookieStore.set("lastProject", organizations[0].projects[0].slug);

        return {
          id: user.id.toString(),
          email: user.email,
          displayName: user.displayName,
          profileImageURL: user.profileImageURL,
        };
      },
    }),
  ],
  pages: {
    signIn: "/authentication/signin",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log("JWT callback triggered with:", {
        trigger,
        hasUser: !!user,
        hasSession: !!session,
      });

      if (user) {
        token.email = user.email;
        token.displayName = user.displayName;
        token.profileImageURL = user.profileImageURL;
      }

      // Handle session update triggers
      if (trigger === "update" && session) {
        console.log("Updating JWT token with session data:", session);
        token.email = session.email || token.email;
        token.displayName = session.displayName || token.displayName;
        token.profileImageURL =
          session.profileImageURL || token.profileImageURL;
      }

      return token;
    },
    async session({ session, token, trigger, newSession }) {
      console.log("Session callback triggered with:", {
        trigger,
        hasNewSession: !!newSession,
      });

      // Handle session update triggers (like profile updates)
      if (trigger === "update" && newSession) {
        console.log("Updating session with new data:", newSession);
        // Update token with new session data
        token.email = newSession.email || token.email;
        token.displayName = newSession.displayName || token.displayName;
        token.profileImageURL =
          newSession.profileImageURL || token.profileImageURL;
      }

      return {
        ...session,
        user: {
          email: token.email,
          displayName: token.displayName,
          profileImageURL: token.profileImageURL,
        },
      };
    },
  },
} satisfies NextAuthOptions;

export const getSession = () => getServerSession(authOptions);
