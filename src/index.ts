import "dotenv/config";
import courseRoute from "./routes/courses.js";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth.js";

const app = new Hono();

// Enable logging middleware
app.use(logger());

// Enable CORS for all routes
app.use('*', cors({
  origin: [process.env.Frontend_url!, process.env.Backend_url!], // Make sure these env vars are set without "!"
  credentials: true  
}));

// Auth handler for /api/auth/*
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  try {
    console.log(`[AUTH DEBUG] ${c.req.method} ${c.req.url}`);
    const res = await auth.handler(c.req.raw);
    console.log(`[AUTH DEBUG] Response Status: ${res.status}`);
    return res;
  } catch (err) {
    console.error(`[AUTH ERROR]`, err);
    const errorMessage = (err instanceof Error) ? err.message : String(err);
    return c.json({ error: 'Internal error in auth handler', message: errorMessage }, 500);
  }
});

// Mount your API routes
app.route('/api', courseRoute);

// Health check endpoint
app.get("/health", (c) => c.json({ status: "OK" }));

// Serve static assets from ./public folder
app.use("/assets/*", serveStatic({ root: "./public" }));
app.use("/favicon.ico", serveStatic({ path: "./public/favicon.ico" }));
app.use("/static/*", serveStatic({ root: "./public" }));
app.use("/*", serveStatic({ root: "./public" }));

// SPA fallback for client-side routing (make sure this is last)
app.get("*", serveStatic({ path: "./public/index.html" }));

// Optional: 404 fallback
app.notFound((c) => c.html("<h2>404 - Not Found</h2>", 404));

// Export app for Vercel
export default app;
