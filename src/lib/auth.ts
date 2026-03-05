import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authConfig: NextAuthConfig = {
    trustHost: true,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        MicrosoftEntraID({
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        }),
        Credentials({
            name: "Dummy Dev Account",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "root@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                const email = credentials.email as string;
                const password = credentials.password as string;

                // Dev-only hardcoded dummy accounts testing
                if (
                    ["root@example.com", "admin@example.com", "user@example.com", "guest@example.com"].includes(email) &&
                    password === email.split("@")[0] + "&2024"
                ) {
                    // If this dummy dev user doesn't exist, create it.
                    let user = await prisma.user.findUnique({ where: { email } });
                    const roleMap: Record<string, string> = {
                        "root@example.com": "super_admin",
                        "admin@example.com": "admin",
                        "user@example.com": "user",
                        "guest@example.com": "guest",
                    };

                    if (!user) {
                        // Check if any organization exists, if not, create a dummy one for dev
                        let org = await prisma.organization.findFirst();
                        if (!org) {
                            org = await prisma.organization.create({ data: { name: "Dev Organization" } });
                        }

                        user = await prisma.user.create({
                            data: {
                                email,
                                name: email.split("@")[0].toUpperCase(),
                                role: roleMap[email],
                                organizationId: org.id,
                            },
                        });
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        organizationId: user.organizationId,
                    };
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "credentials") return true;

            if (!user.email) return false;

            // OAuth sign in flow
            const existingUser = await prisma.user.findUnique({ where: { email: user.email } });

            if (!existingUser) {
                // If there's no organization, this first login won't have an org to attach to.
                // But User model requires organizationId.
                // Setup wizard will handle this. We will create a "PENDING_SETUP" org if none exists.
                let org = await prisma.organization.findFirst();
                if (!org) {
                    // Return truthy to let them login, the DB user won't exist yet, 
                    // but token will allow them to access /setup
                    return true;
                }

                // Create guest user
                await prisma.user.create({
                    data: {
                        email: user.email,
                        name: user.name || "Unknown",
                        image: user.image,
                        role: "guest",
                        organizationId: org.id
                    }
                });
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                // Initial sign-in
                const dbUser = await prisma.user.findUnique({ where: { email: user.email as string } });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.organizationId = dbUser.organizationId;
                } else if (user.email) {
                    // Case where login succeeded but no user in DB (first time setup)
                    token.role = "pending_setup";
                }
            }

            // Allow updating session data
            if (trigger === "update" && session) {
                token = { ...token, ...session };
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.organizationId = token.organizationId as string;
            }
            return session;
        },
    },
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
