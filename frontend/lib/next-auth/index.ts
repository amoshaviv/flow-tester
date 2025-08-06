import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthOptions, getServerSession } from "next-auth";
import { getDBModels } from "@/lib/sequelize";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        displayName: { label: "Name", type: "displayName" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log(credentials);
        const dbModels = await getDBModels();
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await dbModels.User.findByEmail(credentials.email);

        if (!user) {
          if (!credentials?.displayName) throw new Error("Invalid credentials");
          const newUser = await dbModels.User.create({
            email: credentials.email,
            password: credentials.password,
            displayName: credentials.displayName,
            provider: "credentials",
            providerId: credentials.email,
          });

          return {
            id: newUser.id.toString(),
            email: newUser.email,
            displayName: newUser.displayName,
            profileImageURL: newUser.profileImageURL,
          };
        }

        if (!user.authenticate(credentials.password)) {
          throw new Error("Invalid credentials");
        }

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
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.displayName = user.displayName;
        token.profileImageURL = user.profileImageURL;
      }
      return token;
    },
    async session({ session, token }) {
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
