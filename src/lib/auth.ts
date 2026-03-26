import { betterAuth } from "better-auth";
import { D1Adapter } from "better-auth/adapters/drizzle";
import type { CloudflareEnv } from "../../cloudflare-env";

export const createAuth = (env: CloudflareEnv) =>
  betterAuth({
    database: new D1Adapter(env.DB), // Cloudflare D1

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Enable in production
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      apple: {
        clientId: env.APPLE_CLIENT_ID,
        clientSecret: env.APPLE_CLIENT_SECRET,
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update every 24 hours
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },

    // Store sessions in Cloudflare KV for edge performance
    advanced: {
      sessionStorage: {
        async get(sessionId) {
          return await env.KV.get(`session:${sessionId}`, "json");
        },
        async set(sessionId, data) {
          await env.KV.put(`session:${sessionId}`, JSON.stringify(data), {
            expirationTtl: 60 * 60 * 24 * 7, // 7 days
          });
        },
        async delete(sessionId) {
          await env.KV.delete(`session:${sessionId}`);
        },
      },
    },
  });
