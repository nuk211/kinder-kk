//@ts-nocheck
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your-email@example.com" },
        password: { label: "Password", type: "password", placeholder: "••••••••" },
        role: { label: "Role", type: "text", placeholder: "Role" }, // Optional: if you want role-specific login
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { 
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              phoneNumber: true,
            },
          });

          if (!user) {
            throw new Error("No user found with this email");
          }

          // Optional: Role-specific validation
          if (credentials.role && user.role !== credentials.role) {
            throw new Error(`Invalid login for ${credentials.role.toLowerCase()} account`);
          }

          let isPasswordValid = false;

          if (user.password.startsWith("$2")) {
            isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          } else {
            isPasswordValid = credentials.password === user.password;

            if (isPasswordValid) {
              const hashedPassword = await bcrypt.hash(credentials.password, 12);
              await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
              });
            }
          }

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phoneNumber: user.phoneNumber,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw error instanceof Error ? error : new Error("Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phoneNumber = user.phoneNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phoneNumber = token.phoneNumber;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };