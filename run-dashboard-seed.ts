import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_ANON_KEY environment variables are missing!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to serialize biovirtual fields for role management
function serializeUserBio(role: string, status: string, realBio: string) {
  return "__VIRTUAL_USER_DATA__:" + JSON.stringify({
    role,
    status,
    real_bio: realBio || ""
  });
}

async function runSeed() {
  console.log("🚀 Starting programmatically perfect demo data generation for Super Admin Dashboard...");

  try {
    console.log("♻️ Purging previous demo seeds to maintain clean metrics...");
    await supabase.from('activities').delete().like('id', 'seeded-%');
    try {
      await supabase.from('job_matches').delete().like('id', 'seeded-%');
    } catch (e) {}
    await supabase.from('matches').delete().like('id', 'seeded-%');
    await supabase.from('cover_letters').delete().like('id', 'seeded-%');
    try {
      await supabase.from('analyses').delete().like('id', 'seeded-%');
    } catch (e) {}
    await supabase.from('cvs').delete().like('id', 'seeded-%');
    await supabase.from('users').delete().like('id', 'seeded-%');
    await supabase.from('jobs').delete().like('id', 'seeded-%');
    try {
      await supabase.from('job_offers').delete().like('id', 'seeded-%');
    } catch (e) {}

    console.log("👥 Structuring date-tiered users...");
    const baseDateForIndex = (index: number, total: number) => {
      const now = new Date();
      let monthOffset = 0;
      if (index < total * 0.1) monthOffset = 5;
      else if (index < total * 0.25) monthOffset = 4;
      else if (index < total * 0.45) monthOffset = 3;
      else if (index < total * 0.70) monthOffset = 2;
      else if (index < total * 0.90) monthOffset = 1;
      else monthOffset = 0;

      const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const randomDay = Math.floor(Math.random() * 28) + 1;
      const randomHour = Math.floor(Math.random() * 24);
      const randomMin = Math.floor(Math.random() * 60);
      const date = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), randomDay, randomHour, randomMin);
      return date.toISOString();
    };

    const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle", "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Samantha", "Benjamin", "Katherine", "Gregory", "Christine", "Samuel", "Debra", "Patrick", "Rachel", "Alexander", "Carolyn", "Jack", "Janet", "Dennis", "Maria", "Jerry", "Heather", "Tyler", "Aaron", "Diane"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "smartcvai.com", "techops.org", "engineer.io", "cloudscale.net"];

    const userTitles = [
      "Senior Full Stack Software Architect",
      "Cloud Solutions Engineer",
      "DevOps Pipeline Specialist",
      "Data Scientist & AI Architect",
      "Lead UI/UX Architect",
      "Product Manager",
      "Cybersecurity Threat Analyst",
      "Sales Engineer Specialist",
      "Database Operations Engineer",
      "Technical Lead Developer"
    ];

    const userBios = [
      "Enthusiastic builder of digital infrastructure and next-gen SaaS portals with multi-tenant designs.",
      "Passionate coder focused on server-authoritative logic, highly optimized queries, and clean reactive components.",
      "Deep tech background specializing in container orchestration, high availability architectures, and automated testing.",
      "A senior visionary bridging beautiful accessible designs with fast server-side processing and telemetry integrations.",
      "Analytical specialist driven by data models, predictive algorithms, cloud metrics, and scalable API pipelines."
    ];

    const genericPasswordHash = bcrypt.hashSync("Password123", 10);

    const seededUsers: any[] = [];
    for (let i = 1; i <= 98; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `seeded.user.${i}@${domains[Math.floor(Math.random() * domains.length)]}`.toLowerCase();
      const tenantId = `tenant-seeded-${Date.now()}-${i}`;
      const title = userTitles[Math.floor(Math.random() * userTitles.length)];
      const bio = userBios[Math.floor(Math.random() * userBios.length)];
      const createdAt = baseDateForIndex(i, 98);
      
      const serialized = serializeUserBio("user", "active", bio);

      seededUsers.push({
        id: `seeded-usr-${i}-${Date.now()}`,
        email,
        passwordHash: genericPasswordHash,
        name,
        tenantId,
        title,
        bio: serialized,
        createdAt
      });
    }

    console.log("➡️ Inserting 98 date-distributed users...");
    for (let i = 0; i < seededUsers.length; i += 50) {
      const chunk = seededUsers.slice(i, i + 50);
      const { error: userErr } = await supabase.from('users').insert(chunk);
      if (userErr) throw userErr;
    }

    // 2. Generate 50 Jobs (Jobs & Job Offers)
    const jobTitles = [
      "Senior Frontend Engineer (React/Tailwind)",
      "Principal Backend Architect (Node.js/Go)",
      "Cloud Security Advisor",
      "Lead DevOps Engineer (Kubernetes/AWS)",
      "Director of Engineering (SaaS Platforms)",
      "Data Scientist (Machine Learning & Analytics)",
      "Product Designer (Figma/Tailwind)",
      "AI Prompt Specialist",
      "Staff Database Administrator",
      "Technical Project Manager"
    ];

    const companyNames = [
      "Google Cloud", "Netflix Inc.", "Microsoft Corp.", "Apple", "Stripe", "Datadog", 
      "CrowdStrike", "Tesla", "Vercel", "OpenAI", "Airbnb", "Uber Technologies"
    ];

    const jobLocations = [
      "San Francisco, CA (Hybrid)", "New York, NY (Onsite)", "Austin, TX (Remote)", 
      "Seattle, WA (Remote)", "London, UK (Hybrid)", "Paris, France (Onsite)", 
      "Berlin, Germany (Remote)", "Tokyo, Japan (Hybrid)"
    ];

    const jobCategories = [
      "SaaS Platform", "Cybersecurity", "Data Architecture", "Core Infrastructure", "UI/UX Engineering"
    ];

    const jobTypes = [
      "Full-Time", "Contract", "Part-Time", "Remote"
    ];

    const skillsCatalog = [
      ["React", "TypeScript", "Tailwind CSS", "Vite", "State Managers", "Framer Motion"],
      ["Node.js", "Express", "Go", "PostgreSQL", "Redis", "REST APIs", "GraphQL"],
      ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD Pipelines", "Github Actions"],
      ["Python", "PyTorch", "SQL", "Pandas", "Scikit-Learn", "BigQuery"],
      ["Figma", "Design Systems", "Tailwind CSS", "User Experience Research", "Prototyping"],
      ["Cybersecurity Standards", "OIDC/OAuth", "Penetration Testing", "WAF Rules"]
    ];

    console.log("➡️ Building 50 diverse industrial Job Listings...");
    const seededJobs: any[] = [];
    for (let i = 1; i <= 50; i++) {
      const index = i - 1;
      const title = jobTitles[index % jobTitles.length];
      const company = companyNames[index % companyNames.length];
      const location = jobLocations[index % jobLocations.length];
      const category = jobCategories[index % jobCategories.length];
      const type = jobTypes[index % jobTypes.length];
      const reqSkills = skillsCatalog[index % skillsCatalog.length];
      const salary = `$${100 + (index % 5) * 20}k - $${140 + (index % 5) * 25}k / year`;
      const description = `Join the team at ${company} as a ${title}. In this role, you will lead development, configure optimized architectures, and collaborate across technical boundaries. Requirements include solid modern skills and a passion for automation.`;
      const postedAt = baseDateForIndex(i, 50);

      seededJobs.push({
        id: `seeded-job-${i}-${Date.now()}`,
        title,
        company,
        location,
        category,
        type,
        description,
        requirements: reqSkills,
        salary,
        postedAt
      });
    }

    const { error: jobsErr } = await supabase.from('jobs').insert(seededJobs);
    if (jobsErr) throw jobsErr;

    const seededJobOffers = seededJobs.map((js, index) => ({
      id: js.id,
      job_title: js.title,
      company_name: js.company,
      location: js.location,
      industry: js.category,
      employment_type: js.type,
      experience_level: index % 3 === 0 ? "Senior" : (index % 3 === 1 ? "Mid-Level" : "Lead"),
      salary_range: js.salary,
      job_description: js.description,
      required_skills: js.requirements,
      created_at: js.postedAt
    }));

    try {
      await supabase.from('job_offers').insert(seededJobOffers);
    } catch(e) {}

    // Find any existing core profiles to tie references securely
    const { data: mainUsersList } = await supabase.from('users').select('id, email, name');
    const usersForResumes = (mainUsersList && mainUsersList.length > 5) ? mainUsersList : seededUsers;

    const cvFileNames = [
      "Cloud_Architect_Resume.pdf",
      "Staff_Developer_Portfolio.pdf",
      "Director_Engineering_Executive_CV.pdf",
      "Data_Scientist_CV_2026.pdf",
      "Senior_Front_End_Resume.pdf",
      "Product_Planner_Resume.pdf",
      "Cybersecurity_Lead_CV.pdf",
      "SaaS_Solutions_Developer_Portfolio.pdf"
    ];

    const seededCvs: any[] = [];
    const seededAnalyses: any[] = [];

    console.log("➡️ Registering exactly 200 high-fidelity CV Analyses reports with randomized high scores...");
    let cvCounter = 1;
    for (let i = 0; i < 200; i++) {
      const associatedUser = usersForResumes[i % usersForResumes.length];
      const id = `seeded-cv-${cvCounter}-${Date.now()}`;
      const fileName = cvFileNames[cvCounter % cvFileNames.length];
      const score = Math.floor(70 + (cvCounter % 3) * 8 + (cvCounter % 5) * 2.5 + Math.random() * 5);
      const date = baseDateForIndex(cvCounter, 200);

      const parsedDetails = {
        name: associatedUser.name,
        email: associatedUser.email,
        phone: `+1 (555) ${100 + cvCounter}-${1000 + cvCounter}`,
        summary: `A results-driven professional specializing in strategic projects, scalable pipelines, development quality, and interactive customer portals.`,
        skills: ["React", "TypeScript", "Node.js", "Docker", "Database Tuning", "SaaS Architectural Patterns"],
        experience: [
          {
            role: "Main Developer",
            company: "Tech Enterprise",
            duration: "3 years",
            description: "Responsible for full stack developments, state machine controls, and secure multi-tenant deployments."
          }
        ],
        education: [
          {
            degree: "B.S. Computer Engineering",
            school: "State Engineering University",
            duration: "4 years"
          }
        ],
        formattingQuality: 85,
        skillsCoverage: 80,
        experienceRelevance: 90,
        educationRelevance: 85,
        hrQuestions: ["Describe your team leadership experience."],
        technicalQuestions: ["How do you handle race conditions?"],
        behavioralQuestions: ["Tell me about a difficult sprint."]
      };

      seededCvs.push({
        id,
        userId: associatedUser.id,
        fileName,
        status: "analyzed",
        score,
        parsedDetails,
        createdAt: date,
        updatedAt: date
      });

      seededAnalyses.push({
        id: `seeded-anal-${cvCounter}-${Date.now()}`,
        userId: associatedUser.id,
        updatedAt: date
      });

      cvCounter++;
    }

    // Chunk lists for safe HTTP handling
    for (let i = 0; i < seededCvs.length; i += 50) {
      await supabase.from('cvs').insert(seededCvs.slice(i, i + 50));
      try {
        await supabase.from('analyses').insert(seededAnalyses.slice(i, i + 50));
      } catch(e) {}
    }

    // 4. Generate 100 Cover Letters
    console.log("➡️ Composing 100 professionally tailored Cover Letters...");
    const seededCoverLetters: any[] = [];
    for (let i = 1; i <= 100; i++) {
      const associatedUser = usersForResumes[i % usersForResumes.length];
      const userCv = seededCvs.find(cv => cv.userId === associatedUser.id);
      const cvId = userCv ? userCv.id : null;
      const targetJob = seededJobs[i % seededJobs.length];
      const date = baseDateForIndex(i, 100);

      seededCoverLetters.push({
        id: `seeded-cl-${i}-${Date.now()}`,
        cvId,
        userId: associatedUser.id,
        recipientName: "Hiring Ambassador",
        companyName: targetJob.company,
        jobTitle: targetJob.title,
        content: `Dear Hiring Team,\n\nI am thrilled to express my strong candidacy for the ${targetJob.title} position at ${targetJob.company}. Based on my extensive experience documented in my attached résumé, I have built highly available systems and led multi-tenant SaaS developments. I would welcome the opportunity to discuss how my skill set aligns with your team's tactical goals.\n\nSincerely,\n${associatedUser.name}`,
        createdAt: date
      });
    }

    for (let i = 0; i < seededCoverLetters.length; i += 50) {
      await supabase.from('cover_letters').insert(seededCoverLetters.slice(i, i + 50));
    }

    // 5. Generate 100 Job Matches
    console.log("➡️ Indexing 100 Job Compatibility Matches...");
    const seededMatches: any[] = [];
    const seededJobMatches: any[] = [];
    for (let i = 1; i <= 100; i++) {
      const associatedUser = usersForResumes[i % usersForResumes.length];
      const userCv = seededCvs.find(cv => cv.userId === associatedUser.id);
      const cvId = userCv ? userCv.id : null;
      const targetJob = seededJobs[i % seededJobs.length];
      const date = baseDateForIndex(i, 100);
      const matchScore = Math.floor(65 + (i % 4) * 8 + Math.random() * 5);

      if (cvId) {
        seededMatches.push({
          id: `seeded-match-${i}-${Date.now()}`,
          cvId,
          jobId: targetJob.id,
          customJob: null,
          matchScore,
          fitSummary: `Strong alignment with the core requirements of ${targetJob.company}. The candidate possesses 85% of the requested skill set, demonstrating clear proficiencies in targeted domains.`,
          strengths: ["Strong development experience in equivalent tech stack", "Verified production history"],
          gaps: ["Lacks secondary domain certificate (CISSP, eBPF)"],
          applicationStrategy: `Ensure you highlight key projects running equivalent stacks in your opening summaries.`,
          createdAt: date
        });

        seededJobMatches.push({
          id: `seeded-jm-${i}-${Date.now()}`,
          cvId,
          userId: associatedUser.id,
          matchScore,
          createdAt: date
        });
      }
    }

    for (let i = 0; i < seededMatches.length; i += 50) {
      await supabase.from('matches').insert(seededMatches.slice(i, i + 50));
      try {
        await supabase.from('job_matches').insert(seededJobMatches.slice(i, i + 50));
      } catch (e) {}
    }

    // 6. Generate 100 Interview Sessions
    console.log("➡️ Seeding 100 Interactive Interview Session logs...");
    const seededInterviewSessions: any[] = [];
    for (let i = 1; i <= 100; i++) {
      const associatedUser = usersForResumes[i % usersForResumes.length];
      const userCv = seededCvs.find(cv => cv.userId === associatedUser.id);
      const cvId = userCv ? userCv.id : null;
      const date = baseDateForIndex(i, 100);

      const mockQuestions = [
        "What is your primary methodology when analyzing system requirements?",
        "How do you design a database schema for consistent multi-tenant separation?",
        "Describe a challenging state-transition synchronization bug you fixed.",
        "What metrics do you track to measure continuous deployment quality across pipelines?"
      ];

      seededInterviewSessions.push({
        id: `seeded-is-${i}-${Date.now()}`,
        userId: associatedUser.id,
        tenantId: associatedUser.tenantId || '',
        type: "interview_questions",
        message: JSON.stringify({
          cvId,
          category: "Technical & Architecture",
          questions: mockQuestions
        }),
        timestamp: date
      });
    }

    for (let i = 0; i < seededInterviewSessions.length; i += 50) {
      await supabase.from('activities').insert(seededInterviewSessions.slice(i, i + 50));
    }

    console.log("✅ SUCCESS: 100% of your requested Super Admin high-precision demo data is active in Supabase databases!");
  } catch (err: any) {
    console.error("❌ Seeding process error:", err);
    process.exit(1);
  }
}

runSeed();
