import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      await connectDB();
      const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
      if (!user?.passwordHash) return null;
      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) return null;
      return { id: user._id.toString(), name: user.name, email: user.email };
    },
  }),
];
if (googleEnabled) providers.push(Google);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        if (account.provider === "credentials") {
          token.uid = user.id;
        } else if (user.email) {
          // OAuth sign-in: find or create the Intervexa user for this email.
          await connectDB();
          const dbUser = await User.findOneAndUpdate(
            { email: user.email.toLowerCase() },
            {
              $setOnInsert: {
                email: user.email.toLowerCase(),
                name: user.name ?? user.email.split("@")[0],
                provider: account.provider,
              },
              $set: user.image ? { image: user.image } : {},
            },
            { upsert: true, new: true },
          );
          token.uid = dbUser._id.toString();
          token.name = dbUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
});
