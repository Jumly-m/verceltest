import "dotenv/config";
import * as schema from "./schema.js";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { EnhancedQueryLogger } from "drizzle-query-logger";

//ensure variables are loaded from .env file
if(!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN){
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in the environment variables');
}



//create a client for the LibSQL database
//using the environment variables for connection
const client  = createClient({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN  as string,
    
})

// Step 3: Create the drizzle db instance
// If you want to use both schemas, merge them into a single object:
const mergedSchema = { ...schema };
export const db = drizzle(client, { schema: mergedSchema, logger: new EnhancedQueryLogger() });