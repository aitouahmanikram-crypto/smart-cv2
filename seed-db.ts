import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Seeding failed: SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const jobOffersData = [
  // Software Engineering
  {
    id: "job_off_01",
    job_title: "Senior Full-Stack Engineer",
    company_name: "Stripe",
    location: "Seattle, WA (Remote)",
    industry: "Software Engineering",
    employment_type: "Full-time",
    experience_level: "Senior",
    salary_range: "$160,000 - $210,000",
    job_description: "We are looking for a Senior Full-Stack Engineer to architect and build the next generation of our global merchant dashboards. In this role, you will lead the implementation of reliable web banking applications that process millions of transactions per day. You will collaborate with design, product management, and systems engineering to ensure API responsiveness, frontend performance, and fault-tolerant system integration. You will mentor junior and mid-level programmers and set engineering standard practices across the tech stack.",
    required_skills: ["React", "Node.js", "TypeScript", "REST APIs", "SQL", "PostgreSQL", "AWS", "System Architecture", "Security Protocols"]
  },
  {
    id: "job_off_02",
    job_title: "Junior Frontend Developer",
    company_name: "Linear",
    location: "San Francisco, CA (Hybrid)",
    industry: "Software Engineering",
    employment_type: "Full-time",
    experience_level: "Junior",
    salary_range: "$90,000 - $115,000",
    job_description: "Linear is searching for an ambitious Junior Frontend Developer with an eye for pixel-perfect user experiences and high performance. You will help build out fluid transitions, real-time ticket statuses, and responsive components using React and Tailwind CSS. You will work within our seasoned design and engineer taskforces to translate creative systems into beautifully active screens. Our ideal candidate is comfortable with modern React hooks, git-based workflows, and enjoys polishing details like micro-interactions and transitions.",
    required_skills: ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind CSS", "Git", "Responsive Design"]
  },
  // Data Science
  {
    id: "job_off_03",
    job_title: "Mid-Level Data Scientist",
    company_name: "Netflix",
    location: "Los Gatos, CA (Remote)",
    industry: "Data Science",
    employment_type: "Full-time",
    experience_level: "Mid-Level",
    salary_range: "$130,000 - $165,000",
    job_description: "Join Netflix as a Data Scientist on our content recommendation squad. You will lead the analysis of viewing habits to design custom streaming suggestions. You will develop predictive metrics, deploy experiments, and design detailed dashboard insights to help guide strategic acquisitions. In this role, you will leverage SQL, Python, and big data clusters to build datasets, run cohort analyses, and present clear diagnostic graphs to executive teams.",
    required_skills: ["Python", "SQL", "Pandas", "NumPy", "A/B Testing", "Tableau", "Data Modeling", "Big Data"]
  },
  {
    id: "job_off_04",
    job_title: "Data Science Intern",
    company_name: "Airbnb",
    location: "San Francisco, CA (Hybrid)",
    industry: "Data Science",
    employment_type: "Internship",
    experience_level: "Internship",
    salary_range: "$45 - $60 / Hour",
    job_description: "We are offering a summer Data Science Internship for current students eager to apply scholastic modeling methods to real hospitality data. Supported by a senior mentor, you will clean raw event streams, run queries to analyze booking trends, and formulate statistical hypotheses. This is a highly collaborative role where you will present your conclusions to engineering teams and contribute directly to active data processing pipelines.",
    required_skills: ["SQL", "Python", "R", "Data Cleaning", "Matplotlib", "Seaborn", "Excel", "Data Wrangling"]
  },
  // Artificial Intelligence
  {
    id: "job_off_05",
    job_title: "Senior Machine Learning Engineer",
    company_name: "OpenAI",
    location: "San Francisco, CA (On-site)",
    industry: "Artificial Intelligence",
    employment_type: "Full-time",
    experience_level: "Senior",
    salary_range: "$220,000 - $290,000",
    job_description: "OpenAI is seeking a Senior ML Engineer to scale, retrain, and optimize core neural architectures. You will deploy massive parallel model jobs, design custom evaluation loops, and build robust safety filters. You should have comfortable experience with PyTorch, distributed CUDA training, and specialized quantization. This role involves working at the cutting edge of modern neural intelligence and requires a strong background in mathematical concepts.",
    required_skills: ["PyTorch", "Python", "CUDA", "TensorFlow", "Deep Learning", "LLMs", "Distributed Training", "Quantization"]
  },
  {
    id: "job_off_06",
    job_title: "Mid-Level AI Product Engineer",
    company_name: "Anthropic",
    location: "San Francisco, CA (Hybrid)",
    industry: "Artificial Intelligence",
    employment_type: "Full-time",
    experience_level: "Mid-Level",
    salary_range: "$145,000 - $185,000",
    job_description: "We are seeking a Mid-Level AI Product Engineer to design safe, responsive interface pipelines that connect LLMs to consumer applications. You will draft detailed prompt scripts, structure conversational contextual buffers, and implement caching systems to reduce inference latency. You will collaborate on both server-side logic and client interfaces to construct features like semantic searching, smart summary blocks, and interactive AI helpers.",
    required_skills: ["Python", "TypeScript", "Node.js", "LLM APIs", "LangChain", "Vector Databases", "Prompt Engineering", "Vite"]
  },
  // Cybersecurity
  {
    id: "job_off_07",
    job_title: "Senior Security Analyst",
    company_name: "CrowdStrike",
    location: "Austin, TX (Remote)",
    industry: "Cybersecurity",
    employment_type: "Full-time",
    experience_level: "Senior",
    salary_range: "$140,000 - $180,000",
    job_description: "CrowdStrike is search of a Senior Security Analyst to lead critical incident response tasks and threat-hunting workflows. You will inspect alerts, reconstruct security events across endpoints, and design custom rules to stop attack vectors. In this role, you will perform memory analysis, analyze suspicious payloads, and write comprehensive advisory write-ups for executive protection squads worldwide.",
    required_skills: ["SIEM", "Incident Response", "Network Security", "Penetration Testing", "Wireshark", "IDS/IPS", "Scripting", "Threat Hunting"]
  },
  {
    id: "job_off_08",
    job_title: "Junior Security Engineer",
    company_name: "Cloudflare",
    location: "San Francisco, CA (Hybrid)",
    industry: "Cybersecurity",
    employment_type: "Full-time",
    experience_level: "Junior",
    salary_range: "$85,000 - $110,000",
    job_description: "Cloudflare is hiring a Junior Security Engineer to audit and secure internal systems. You will assist in executing vulnerability Scans, reviewing firewall filters, and monitoring network access logs. You will collaborate on security training, verify dependency updates, and research emergent cyber threats. This role is a perfect start for an engineer who desires deep exposure to firewalls, SSL/TLS, and modern identity principles.",
    required_skills: ["Network Security", "Linux", "SSL/TLS", "Vulnerability Scanning", "Nmap", "Firewalls", "Python", "Git"]
  },
  // Marketing
  {
    id: "job_off_09",
    job_title: "Mid-Level Growth Marketing Manager",
    company_name: "Notion",
    location: "New York, NY (Remote)",
    industry: "Marketing",
    employment_type: "Full-time",
    experience_level: "Mid-Level",
    salary_range: "$110,000 - $135,000",
    job_description: "Notion is looking for a multi-faceted Growth Marketing Manager to oversee paid acquisitions, SEO content strategies, and email campaigns. You will coordinate with our design crew to create conversion assets and run A/B optimizations to drive signups. Essential expectations include handling major analytics boards (Google Analytics), running search campaigns, and drafting crisp narratives that appeal to developers.",
    required_skills: ["SEO", "Google Analytics", "SEM", "Copywriting", "A/B Testing", "Email Marketing", "SQL", "Social Media Marketing"]
  },
  {
    id: "job_off_10",
    job_title: "Marketing Intern",
    company_name: "Figma",
    location: "Paris, France (Hybrid)",
    industry: "Marketing",
    employment_type: "Internship",
    experience_level: "Internship",
    salary_range: "€30,000 - €38,000 / Year",
    job_description: "Join Figma as a Marketing Intern on our European Community team. You will support online workshops, gather creator reviews, organize social calendars, and track engagement across community portals. Candidates should have a creative mindset, excellent written communication, familiarity with social channels, and basic experience using design software to build posts.",
    required_skills: ["Social Media Management", "Content Creation", "Figma", "Market Research", "Events Coordination", "Copywriting", "French"]
  },
  // Human Resources
  {
    id: "job_off_11",
    job_title: "Senior HR Business Partner",
    company_name: "Deel",
    location: "London, UK (Remote)",
    industry: "Human Resources",
    employment_type: "Full-time",
    experience_level: "Senior",
    salary_range: "£110,000 - £140,000",
    job_description: "Deel is searching for a Senior HR Business Partner to support our global engineering and Operations squads. You will align human resource frameworks with broader organizational objectives, oversee compensation and workforce reviews, and resolve complex employee relations cases. Extensive knowledge of UK labor compliance, performance management systems, and organizational design standards is required.",
    required_skills: ["Employee Relations", "UK Labor Law", "Performance Management", "Workforce Planning", "Conflict Resolution", "HRIS", "Compensation Strategy"]
  },
  {
    id: "job_off_12",
    job_title: "Junior Talent Acquisition Coordinator",
    company_name: "Retool",
    location: "San Francisco, CA (On-site)",
    industry: "Human Resources",
    employment_type: "Full-time",
    experience_level: "Junior",
    salary_range: "$75,000 - $95,000",
    job_description: "Retool is growing and we are seeking an dynamic Talent Coordinator to manage candidate tracking and schedule interviews across technical panels. You will handle workflows in our ATS (Ashby), coordinate complex multi-timezone panels, draft invitation templates, and ensure every candidate leaves with an extraordinary impression of our culture. You will also help run university hiring initiatives.",
    required_skills: ["Candidate Management", "Applicant Tracking Systems", "Ashby", "Google Calendar", "Scheduling", "Written Communication", "Detail Oriented"]
  },
  // Accounting
  {
    id: "job_off_13",
    job_title: "Mid-Level Corporate Accountant",
    company_name: "Carta",
    location: "New York, NY (Hybrid)",
    industry: "Accounting",
    employment_type: "Full-time",
    experience_level: "Mid-Level",
    salary_range: "$105,000 - $130,000",
    job_description: "Carta is hunting for a corporate Accountant to execute our monthly ledger closing tasks, reconcile active balance listings, and coordinate seasonal corporate tax filings. You will analyze amortization tables and make sure that all policies perfectly reflect US GAAP framework compliance. Ideal profiles possess solid experience with ERP software (NetSuite), premium Excel skill indexes, and a deep appreciation for spreadsheet details.",
    required_skills: ["US GAAP", "General Ledger", "NetSuite", "Excel Macros", "Account Reconciliation", "Fixed Assets", "Corporate Tax"]
  },
  {
    id: "job_off_14",
    job_title: "Accounting Intern",
    company_name: "Brex",
    location: "Remote (US)",
    industry: "Accounting",
    employment_type: "Internship",
    experience_level: "Internship",
    salary_range: "$30 - $45 / Hour",
    job_description: "Join Brex as a virtual Accounting Intern. In this role, you will help our finance squad categorize corporate card transactions, organize digital invoice receipts, and cross-reference bank entries. You will pick up real-world workflows in modern accounting suites, learn internal billing controls, and build clean reports. High proficiency in quantitative assessments is required.",
    required_skills: ["Excel", "Account Categorization", "Invoice Auditing", "Bookkeeping", "Data Entry", "Detail Oriented", "Finance Reporting"]
  },
  // Finance
  {
    id: "job_off_15",
    job_title: "Senior Financial Analyst",
    company_name: "Ramp",
    location: "New York, NY (On-site)",
    industry: "Finance",
    employment_type: "Full-time",
    experience_level: "Senior",
    salary_range: "$150,000 - $190,000",
    job_description: "Ramp is looking for a Senior Financial Analyst to design robust FP&A forecasts, construct unit economics trackers, and formulate long-term capital allocation projections. You will construct complex financial sheets, track variance budgets across global taskforces, and prepare comprehensive summary reports for our board of directors. Strong SQL credentials and financial modeling expertise are required.",
    required_skills: ["FP&A", "Financial Modeling", "Corporate Finance", "SQL", "Excel Models", "Budget Forecasting", "KPI Dashboards"]
  },
  {
    id: "job_off_16",
    job_title: "Junior Investment Analyst",
    company_name: "Robinhood",
    location: "Menlo Park, CA (Hybrid)",
    industry: "Finance",
    employment_type: "Full-time",
    experience_level: "Junior",
    salary_range: "$85,000 - $105,000",
    job_description: "Join our brokerage operations as a Junior Investment Analyst. You will collect capital market metrics, write concise briefing reports on corporate filings, and track portfolio asset allocations. You will help extract data from SEC papers, update pricing feeds, and evaluate equity metrics. Candidates should possess strong analytical minds, clean report-writing skills, and an active interest in financial markets.",
    required_skills: ["Financial Analysis", "Market Research", "SEC Filings", "Excel", "Data Visualization", "Equity Research", "Python"]
  },
  // Project Management
  {
    id: "job_off_17",
    job_title: "Technical Project Manager",
    company_name: "Asana",
    location: "San Francisco, CA (Remote)",
    industry: "Project Management",
    employment_type: "Full-time",
    experience_level: "Mid-Level",
    salary_range: "$120,000 - $145,000",
    job_description: "Asana is looking for a technical Agile Project Manager to align our product roadmap deliverables with active engineering milestones. You will manage daily standups, clear project blockers, compile comprehensive sprint metrics, and streamline multi-team schedules. Essential qualifications include robust understanding of Scrum and Agile principles, experience with CI/CD delivery models, and excellent communication habits.",
    required_skills: ["Scrum", "Agile Methodologies", "Sprint Planning", "Jira", "Risk Management", "Asana Platform", "SDLC", "CI/CD Concepts"]
  },
  {
    id: "job_off_18",
    job_title: "Project Management Intern",
    company_name: "Miro",
    location: "Amsterdam, Netherlands (Remote)",
    industry: "Project Management",
    employment_type: "Internship",
    experience_level: "Internship",
    salary_range: "€2,000 - €2,800 / Month",
    job_description: "We are offering a remote Project Management Internship for digital coordinators. You will help schedule program reviews, document technical requirement papers, track status boards, and draft team updates. This role is a prime opportunity to master digital workspace patterns, learn agile sprint processes, and manage cross-timezone schedules inside a major SaaS enterprise.",
    required_skills: ["Agile Processes", "Confluence", "Miro Boards", "Documentation", "Project Coordination", "Time Management", "Collaboration"]
  },
  // Business Analysis
  {
    id: "job_off_19",
    job_title: "Senior Operations Business Analyst",
    company_name: "Uber",
    location: "San Francisco, CA (On-site)",
    industry: "Business Analysis",
    employment_type: "Full-time",
    experience_level: "Senior",
    salary_range: "$145,000 - $185,000",
    job_description: "Uber is hiring a Senior Business Analyst to optimize supply-demand pricing strategies. You will inspect millions of trip records, build live Tableau metrics, and identify marketplace friction factors. Strong technical proficiency in SQL and Python is required, as well as a track record of applying statistical models (e.g., linear regressions) to refine logistical outcomes.",
    required_skills: ["SQL", "Python", "Tableau", "Business Analytics", "Statistical Modeling", "Dashboard Design", "Excel Macros", "Requirements Gathering"]
  },
  {
    id: "job_off_20",
    job_title: "Junior Business Systems Analyst",
    company_name: "Slack",
    location: "Denver, CO (Remote)",
    industry: "Business Analysis",
    employment_type: "Full-time",
    experience_level: "Junior",
    salary_range: "$80,000 - $100,000",
    job_description: "Join Slack as a Junior Business Systems Analyst on our internal tooling taskforce. You will analyze internal workflows, write specifications, and configure enterprise solutions (Salesforce). You will gather stakeholder requirements, map data integrations, and build training tutorials. This is a brilliant launching pad for business professionals who want to bridge corporate operations with advanced software designs.",
    required_skills: ["Business Analysis", "Requirements Gathering", "UML Diagrams", "Salesforce CRM", "Jira", "Technical Writing", "SQL", "Google Sheets"]
  }
];

async function seed() {
  console.log("🚀 Starting DB Seed Engine...");
  
  // 1. Purge jobs table
  console.log("🧹 Purging 'jobs' table...");
  const { error: purgeJobsErr } = await supabase.from("jobs").delete().neq("id", "none");
  if (purgeJobsErr) {
    console.warn("⚠️ Warning: Failed to purge jobs table:", purgeJobsErr.message);
  } else {
    console.log("✅ 'jobs' table purged successfully.");
  }

  // 2. Map and insert into jobs table
  console.log(`📤 Seeding ${jobOffersData.length} records into 'jobs' table...`);
  const mappedJobs = jobOffersData.map(o => ({
    id: o.id,
    title: o.job_title,
    company: o.company_name,
    location: o.location,
    category: o.industry,
    type: o.employment_type,
    description: o.job_description,
    requirements: o.required_skills,
    salary: o.salary_range,
    postedAt: new Date().toISOString()
  }));

  const { data: jobsResult, error: jobsErr } = await supabase.from("jobs").insert(mappedJobs).select();
  if (jobsErr) {
    console.error("❌ Error inserting into 'jobs' table:", jobsErr);
  } else {
    console.log(`🎉 Successfully seeded ${jobsResult?.length || 0} jobs into 'jobs' table!`);
  }

  // 3. Purge job_offers table and insert
  console.log("🧹 Purging 'job_offers' table...");
  const { error: purgeOffErr } = await supabase.from("job_offers").delete().neq("id", "none");
  if (purgeOffErr) {
    console.warn("ℹ️ 'job_offers' table deletion failed (it might not exist yet or have RLS locks).");
  } else {
    console.log("✅ 'job_offers' table purged.");
  }

  console.log(`📤 Seeding ${jobOffersData.length} records into 'job_offers' table...`);
  const { data: offersResult, error: offersErr } = await supabase.from("job_offers").insert(
    jobOffersData.map(o => ({
      id: o.id,
      job_title: o.job_title,
      company_name: o.company_name,
      location: o.location,
      industry: o.industry,
      employment_type: o.employment_type,
      experience_level: o.experience_level,
      salary_range: o.salary_range,
      job_description: o.job_description,
      required_skills: o.required_skills,
      created_at: new Date().toISOString()
    }))
  ).select();

  if (offersErr) {
    console.warn("ℹ️ Note: Failure inserting into 'job_offers' table (table might not exist in direct REST schema yet):", offersErr.message);
  } else {
    console.log(`🎉 Successfully seeded ${offersResult?.length || 0} jobs into 'job_offers' table!`);
  }

  console.log("\n==================================================");
  console.log("📊 SEED VERIFICATION SUMMARY");
  console.log("==================================================");
  
  // Double-verify live data from database
  const { count: liveJobsCount } = await supabase.from("jobs").select("*", { count: "exact", head: true });
  console.log(`👉 Verified records in 'jobs': ${liveJobsCount ?? 0} / 20`);
  
  const { count: liveOffersCount } = await supabase.from("job_offers").select("*", { count: "exact", head: true });
  console.log(`👉 Verified records in 'job_offers': ${liveOffersCount ?? 0} / 20`);
  
  console.log("==================================================");
  console.log("🏁 Database seed operation completed.");
}

seed();
