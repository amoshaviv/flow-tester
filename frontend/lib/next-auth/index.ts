import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthOptions, getServerSession } from "next-auth";
import { getDBModels } from "@/lib/sequelize";
import { capitalCase } from "change-case";
import { cookies } from "next/headers";

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

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        displayName: { label: "Name", type: "displayName" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const dbModels = await getDBModels();
        const { User, Organization, Project } = dbModels;
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
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
            console.log(defaultOrganization.isNewRecord);
            const defaultProject = await Project.createWithOrganization(
              `Default Project`,
              newUser,
              defaultOrganization
            );

            // Save redirect URL as a cookie
            cookieStore.set("lastOrganization", defaultOrganization.slug);
            cookieStore.set("lastProject", defaultProject.slug);

            return {
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
    async jwt({ token, user, session }) {
      if (user) {
        token.email = user.email;
        token.displayName = user.displayName;
        token.profileImageURL = user.profileImageURL;
      }
      return token;
    },
    async session({ session, token, trigger }) {
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
