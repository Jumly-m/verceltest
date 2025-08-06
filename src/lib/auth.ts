import "dotenv/config";
import { betterAuth } from "better-auth";
import { db } from "../db/index.js";

import { drizzleAdapter } from  "better-auth/adapters/drizzle";

export const auth = betterAuth({
    database:drizzleAdapter(db,{
        provider:'sqlite'
    }),
    emailAndPassword:{
        enabled:true
    },
    trustedOrigins: [
    process.env.Backend_url as string, // your backend
    process.env.Frontend_url as string, //frontend url 
   
  ],

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
    // 👇 Configure your providers here
    socialProviders:{
        google:{
            enabled:true,
            clientId:process.env.GOOGLE_CLIENT_ID as string,
            clientSecret:process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    // 👇 Configure your session settings here
    
})