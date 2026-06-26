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

async function check() {
  const { data, error } = await supabase.from("users").select("*").limit(1);
  if (error) {
    console.error("Error querying users table:", error);
  } else {
    console.log("Successfully queried users table. Columns present in result:", data.length > 0 ? Object.keys(data[0]) : "No rows in users table to analyze");
  }
}

check();
