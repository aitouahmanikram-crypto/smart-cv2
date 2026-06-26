import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_ANON_KEY is missing!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Try selecting 'role'
  const { data, error } = await supabase.from("users").select("id, email").limit(1);
  console.log("Query 'id, email' direct:", { data, error });

  // Try selecting role
  const { data: roleData, error: roleError } = await supabase.from("users").select("id, role").limit(1);
  console.log("Query 'id, role':", { roleData, roleError });
}

run();
