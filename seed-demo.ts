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

async function runSeed() {
  console.log("🚀 Starting premium SaaS database seeding for PFE Defense...");

  const email = "demo@smartcvai.com";
  const password = "Demo123456";
  const name = "Demo AI Candidate";
  const tenantId = "tenant-pfe-defense-2026";
  const passwordHash = bcrypt.hashSync(password, 10);
  
  let userId = "user-pfe-demo-2026";

  // 1. Dynamic check for existing users with correct email
  console.log(`🔍 Checking if email "${email}" already exists...`);
  const { data: existingUserObj } = await supabase.from("users").select("id, tenantId").eq("email", email.toLowerCase()).maybeSingle();
  if (existingUserObj) {
    console.log(`ℹ️ Email found! Existing userId is "${existingUserObj.id}". Re-using ID for perfect cascade cleaning.`);
    userId = existingUserObj.id;
  }

  // 1. Clean existing records for this demo user to prevent constraints conflicts
  console.log(`🧹 Cleaning previous demo records for userId "${userId}" if any...`);
  try {
    // Delete activities first
    await supabase.from("activities").delete().eq("userId", userId);
    // Delete cover letters
    await supabase.from("cover_letters").delete().eq("userId", userId);
    // Delete job_matches
    await supabase.from("job_matches").delete().eq("userId", userId);
    
    // Select CVs to delete their matches
    const { data: existingCvs } = await supabase.from("cvs").select("id").eq("userId", userId);
    if (existingCvs && existingCvs.length > 0) {
      const cvIds = existingCvs.map(c => c.id);
      await supabase.from("matches").delete().in("cvId", cvIds);
    }
    
    // Delete cvs
    await supabase.from("cvs").delete().eq("userId", userId);
    // Delete user
    await supabase.from("users").delete().eq("id", userId);
  } catch (err) {
    console.warn("⚠️ Warning during database clean, might be empty. Continuing...", err);
  }

  // 2. Insert the Demo User
  console.log(`👤 Creating core premium User account: ${email}`);
  const { error: userError } = await supabase.from("users").insert([{
    id: userId,
    email: email.toLowerCase(),
    passwordHash: passwordHash,
    name,
    tenantId: tenantId,
    title: "Senior Multi-Domain Engineer",
    bio: "PFE Demo Account representing standard candidate lifecycle tracking, multiple job fits, tailored cover drafts, and interview preps.",
    createdAt: new Date().toISOString()
  }]);

  if (userError) {
    console.error("❌ Failed to insert User:", userError);
    process.exit(1);
  }

  // 3. Define the 5 CVs & ATS Reports
  console.log("📄 Populating 5 distinct CV Profiles & ATS Analytics Reports...");

  const profiles = [
    {
      id: "cv-alex-rivera-2026",
      fileName: "Alex_Rivera_Cloud_Architect.pdf",
      score: 92,
      grammarScore: 95,
      impactScore: 90,
      skillsScore: 92,
      summary: "Over 8 years of enterprise experience orchestrating cloud architecture and containerized microservices. Expert in TypeScript, React, Go, and Kubernetes, delivering high-throughput APIs and reliable, secure stateful systems on AWS and GCP.",
      strengths: [
        "Excellent match for senior technical roles",
        "Quantified production metrics (e.g. 35% cost reduction)",
        "Exceptional modern tech stack coverage (Kubernetes, AWS, Go)"
      ],
      weaknesses: [
        "Lacks traditional legacy enterprise certificates",
        "Dual-column formatting may sometimes cause basic ATS parse warnings"
      ],
      atsOptimizations: [
        "Explicitly list Cloud Security specialties",
        "Add a Dedicated Certifications block at the bottom level of the resume"
      ],
      recommendations: [
        "Reformat to a single-column layout for ATS system parsing",
        "Elaborate on specific telemetry/observability loops implemented in Velocity Tech"
      ],
      skillsMatched: ["React", "TypeScript", "Go", "Docker", "Kubernetes", "AWS", "Terraform", "PostgreSQL"],
      skillsMissing: ["Prometheus", "Service Mesh", "eBPF Security Monitoring"],
      parsedDetails: {
        name: "Alex Rivera",
        email: "alex.rivera@cloudops.dev",
        phone: "+1 (555) 349-2045",
        summary: "Lead Software Architect specializing in scalable cloud topologies, multi-tenant container orchestration, and high-performance React APIs.",
        skills: ["React", "TypeScript", "Go", "Docker", "Kubernetes", "AWS", "Terraform", "PostgreSQL", "GraphQL", "Git", "Node.js", "Redis"],
        experience: [
          {
            role: "Lead Cloud Infrastructure Engineer",
            company: "Velocity Tech Inc.",
            duration: "2023 - Present",
            description: "Led development of a high-performance Kubernetes runner pipeline. Reduced average cluster overhead by 35% and saved $180k monthly. Guided an engineering squad of 6 focused on developer tooling."
          },
          {
            role: "Senior Full-Stack Developer",
            company: "DevSync Inc.",
            duration: "2020 - 2023",
            description: "Developed and maintained highly robust React apps, caching servers, and Go APIs. Spearheaded GraphQL schema standardizations, improving load rates of complex pages by 42%."
          }
        ],
        education: [
          {
            degree: "Master of Science in Software Systems",
            school: "Georgia Institute of Technology",
            duration: "2018 - 2020"
          },
          {
            degree: "Bachelor of Science in Computer Science",
            school: "Boston University",
            duration: "2014 - 2018"
          }
        ],
        formattingQuality: 92,
        skillsCoverage: 90,
        experienceRelevance: 95,
        educationRelevance: 88,
        hrQuestions: [
          "Tell me about a time you had to balance cost efficiency vs extreme high availability.",
          "How do you manage disputes or architectural disagreements inside your engineering squad?"
        ],
        technicalQuestions: [
          "Describe how you would design a rate limiter to handle 100,000 requests/sec across a multi-region deployment.",
          "What are the direct trade-offs of using GraphQL resolvers versus optimized REST endpoints?"
        ],
        behavioralQuestions: [
          "Describe a scenario where a deployment broke production during active hours and how you mitigated customer panic.",
          "What is your primary process for mentoring junior developers during a high-stakes sprint?"
        ]
      },
      // Matches Data
      match: {
        jobTitle: "Principal Full-Stack Engineer (Platform-Ops)",
        companyName: "Stripe, Inc.",
        jobDescription: "Seeking a solid Principal Engineer to direct multi-tenant cloud platforms, developer self-service APIs, and low-latency client portals. Strong background in React, Go, and Terraform requested.",
        matchScore: 94,
        fitSummary: "Alex has unparalleled alignment with Stripe's technical parameters. His experience at Velocity Tech directly maps to Stripe's scaling needs.",
        strengths: ["Highly technical background in production-grade Go", "Direct cloud cost reduction outcomes", "Expert-level React architecture skills"],
        gaps: ["No direct financial compliance experience", "Lacks active security-clearance certificates"],
        applicationStrategy: "Apply focusing strongly on Stripe's developer platforms. Highlight Go microservice scale benchmarks in your initial cover letter."
      },
      // Interview Prep
      interview: {
        category: "Software Architecture & Scaling",
        questions: [
          "How would you optimize Stripe billing data pipelines for real-time reporting?",
          "Explain the internal mechanics of a React custom rendering reconciliation cycle.",
          "How do you configure Kubernetes custom controllers for container autoscaling?",
          "Describe a scaling issue where Postgres deadlock errors impeded customer checkouts."
        ]
      }
    },
    {
      id: "cv-sarah-jenkins-2026",
      fileName: "Sarah_Jenkins_ML_Specialist.pdf",
      score: 88,
      grammarScore: 92,
      impactScore: 85,
      skillsScore: 88,
      summary: "PhD in Neural Networks and Machine learning with 5+ years of experience leading advanced research. Expert in PyTorch, HuggingFace transformers, JAX, and high-performance LLM quantization architectures.",
      strengths: [
        "Elite academic credentials in artificial intelligence",
        "Hands-on experience deploying large models on custom hosting nodes",
        "Strong publication record peer-reviewed by ML boards"
      ],
      weaknesses: [
        "Virtually no enterprise web framework experience (React, Angular)",
        "Lower experience with traditional relational schema operations"
      ],
      atsOptimizations: [
        "Include general enterprise database storage keywords like PostgreSQL",
        "Acknowledge cloud API systems (such as FastAPI) prominent in candidate scans"
      ],
      recommendations: [
        "Balance academic terminology with standard business-value indicators",
        "List key GitHub repos focused on open-source machine learning tooling"
      ],
      skillsMatched: ["Python", "PyTorch", "JAX", "Transformers", "LLMs", "C++", "CUDA", "FastAPI"],
      skillsMissing: ["Kubernetes", "Apache Spark", "MLflow ML Ops pipeline"],
      parsedDetails: {
        name: "Sarah Jenkins",
        email: "sarah.jenkins@mlresearch.ai",
        phone: "+1 (555) 728-3901",
        summary: "PhD Research Scientist specializing in transformer efficiency, context compression, hyper-parameter tuning, and LLM fine-tuning schemas.",
        skills: ["Python", "PyTorch", "JAX", "Transformers", "LLMs", "C++", "CUDA", "FastAPI", "Pandas", "Scikit-Learn", "Git", "NumPy"],
        experience: [
          {
            role: "Lead AI Researcher",
            company: "Google DeepMind",
            duration: "2022 - Present",
            description: "Developed and published state-of-the-art transformer context pruning heuristics, improving model throughput rates by 45%. Conducted high-performance computing using JAX across massive TPU pods."
          },
          {
            role: "ML Modeling Scientist",
            company: "Synthesio AI",
            duration: "2019 - 2022",
            description: "Designed a lightweight, Retrieval-Augmented Generation (RAG) platform mapping customer support queries into vector embeddings. Achieved 94% user interaction satisfaction."
          }
        ],
        education: [
          {
            degree: "PhD in Computer Science (Artificial Intelligence)",
            school: "Stanford University",
            duration: "2014 - 2019"
          },
          {
            degree: "Bachelor of Engineering in Electrical Engineering",
            school: "Massachusetts Institute of Technology",
            duration: "2010 - 2014"
          }
        ],
        formattingQuality: 88,
        skillsCoverage: 89,
        experienceRelevance: 85,
        educationRelevance: 98,
        hrQuestions: [
          "Why do you want to transition from traditional pure research into developer platform scaling?",
          "How do you frame complex academic structures to executive business metrics?"
        ],
        technicalQuestions: [
          "Explain the difference between Multi-Query Attention (MQA) and Grouped-Query Attention (GQA).",
          "What processes do you apply to combat vanishing/exploding gradients during severe deep training?"
        ],
        behavioralQuestions: [
          "Tell me about a research experiment that failed completely and how you salvaged the core data.",
          "Describe a work situation where you disagreed with standard software engineers on safety and compliance."
        ]
      },
      match: {
        jobTitle: "Member of Technical Staff - LLM Inference",
        companyName: "OpenAI, LLC",
        jobDescription: "Seeking an ML Specialist to optimize high-throughput, low-latency API inference endpoints for massive foundation models. Deep mastery of CUDA, PyTorch, and token-level optimization required.",
        matchScore: 91,
        fitSummary: "Sarah's model quantization and GPU-layer profiling background matches perfectly with OpenAI's performance objectives.",
        strengths: ["Expert research in transformer pruning", "Advanced CUDA context insights", "Top-tier AI credentials"],
        gaps: ["No Docker/K8s infrastructure references", "Lacks extensive commercial API deployment certifications"],
        applicationStrategy: "Position yourself as an inference performance champion. Emphasize JAX/TPU latency benchmarks and model training metrics."
      },
      interview: {
        category: "Deep Learning & Transformer Scalability",
        questions: [
          "Explain how FlashAttention decreases memory overhead from quadratic to linear.",
          "How do you design an active pipeline for tensor model parallelism across eight H100 GPUs?",
          "What is your approach to handling context length scaling up to 100k tokens in JAX?",
          "Describe quantization techniques like AWQ or GPTQ and their impact on model drift."
        ]
      }
    },
    {
      id: "cv-marcus-chen-2026",
      fileName: "Marcus_Chen_PM_Executive.docx",
      score: 85,
      grammarScore: 90,
      impactScore: 88,
      skillsScore: 82,
      summary: "Strategic, metrics-driven Technical Product Manager with 7+ years of experience leading cross-functional design and engineering squads. Expert in SaaS growth, developer API onboarding, card issuing, and financial workflows.",
      strengths: [
        "Incredible quantifiable business accomplishments",
        "Clear master of core PM analytics (Amplitude, SQL)",
        "Stellar technical-to-business communications mapping"
      ],
      weaknesses: [
        "Lack of direct code production experience highlighted",
        "Lower alignment for native lower-level hardware or security paradigms"
      ],
      atsOptimizations: [
        "Integrate references to agile delivery scale",
        "Explicitly detail interactions with developers as users of APIs to boost match scores"
      ],
      recommendations: [
        "Ensure technical tools (SQL, Git) are prominent alongside management terms",
        "Provide direct examples of project lifecycle strategy mapping to standard templates"
      ],
      skillsMatched: ["Product Strategy", "Roadmapping", "SQL", "Amplitude", "Agile", "Jira", "Figma", "User Research"],
      skillsMissing: ["SOC2 Compliance Auditing", "React Handoff", "Storybook Schema Validation"],
      parsedDetails: {
        name: "Marcus Chen",
        email: "marcus.chen@productcentric.io",
        phone: "+1 (555) 593-1025",
        summary: "Lead fintech product strategist with deep expertise in API developer experience, conversion optimization, and card payment workflows.",
        skills: ["Product Strategy", "Roadmapping", "SQL", "Amplitude", "Agile", "Jira", "Figma", "User Research", "Market Analysis", "Stripe API", "A/B Testing", "Mixpanel"],
        experience: [
          {
            role: "Senior Product Manager",
            company: "Fintech Labs Corp.",
            duration: "2021 - Present",
            description: "Led core upgrades of localized payment gateway flows. Conducted A/B testing raising billing page conversion by 22%. Managed 4 squads across 3 international offices."
          },
          {
            role: "Technical Product Owner",
            company: "PayGrid Software",
            duration: "2018 - 2021",
            description: "Orchestrated developer onboarding portals. Reduced average integration dropouts by 40% using advanced interactive playground templates. Audited API specs with swagger docs."
          }
        ],
        education: [
          {
            degree: "Master of Business Administration (MBA)",
            school: "Wharton School of Business",
            duration: "2016 - 2018"
          },
          {
            degree: "Bachelor of Science in Commerce",
            school: "University of Virginia",
            duration: "2012 - 2016"
          }
        ],
        formattingQuality: 90,
        skillsCoverage: 80,
        experienceRelevance: 88,
        educationRelevance: 85,
        hrQuestions: [
          "Describe your exact process for killing an underperforming feature that engineers worked hard on.",
          "How do you handle severe pushback from engineering leads about your strategic product timeline?"
        ],
        technicalQuestions: [
          "How would you explain the architectural advantages of gRPC versus REST APIs to a pure marketing executive?",
          "How do you construct SQL queries to analyze monthly cohort churn using a transaction ledger?"
        ],
        behavioralQuestions: [
          "Describe a high-stakes product launch that failed on day one and how you managed customer communication.",
          "Give an example of a feedback loop that completely changed your strategic roadmap direction."
        ]
      },
      match: {
        jobTitle: "Lead Technical Product Manager - Developer Platform",
        companyName: "Stripe",
        jobDescription: "Seeking a product-centric leader to streamline Stripe developer documentation, integration SDKs, and sandbox testing systems. Background in product analytics and APIs expected.",
        matchScore: 87,
        fitSummary: "Marcus possesses an outstanding blend of metrics-oriented product strategy and fintech infrastructure familiarities.",
        strengths: ["Exceptional optimization track record (+22% conversion)", "In-depth payment workflow fluency", "Strong product analytics credentials"],
        gaps: ["Lacks direct systems programming experience", "Lower exposure to high-level compliance frameworks"],
        applicationStrategy: "Focus on API onboarding conversion metrics. Bring up payment sandbox playground architectures you designed."
      },
      interview: {
        category: "Product Management & API Conversion",
        questions: [
          "How do you measure developer friction when onboarding onto a new webhook system?",
          "How would you design an intuitive analytics dashboard for card issuers?",
          "What is your paradigm of balancing tech debt vs innovative product expansion?",
          "How would you increase active sign-up rates for Stripe's checkout widgets?"
        ]
      }
    },
    {
      id: "cv-elena-rostova-2026",
      fileName: "Elena_Rostova_Cybersec_Architect.pdf",
      score: 86,
      grammarScore: 88,
      impactScore: 84,
      skillsScore: 86,
      summary: "Dedicated Security Architect with 6+ years of military-grade penetration testing, zero-trust infrastructure hardening, and automated threat modeling. Certified CISSP and CEH professional with expertise in Kubernetes cluster shield techniques.",
      strengths: [
        "Premium certified pedigree (CISSP, CEH)",
        "Advanced deep-dive knowledge of cloud container security threat loops",
        "Hands-on scripting track record automanting static security scans"
      ],
      weaknesses: [
        "Relatively dry language lacking product engagement indicators",
        "Slightly short tenure lists in earlier advisory capacities"
      ],
      atsOptimizations: [
        "Include reference of compliance standards like HIPAA or SOC2 within main descriptions",
        "Detail specific identity access management definitions to trigger match criteria"
      ],
      recommendations: [
        "Incorporate qualitative metrics highlighting cost savings from mitigated security breaches",
        "Bold key technologies like WireGuard or OpenID Connect in skills matrix blocks"
      ],
      skillsMatched: ["CISSP", "Penetration Testing", "Threat Modeling", "IAM", "OWASP", "Terraform", "Linux", "SOC2"],
      skillsMissing: ["AWS Security Specialty", "NIST Framework Auditing", "Azure Entra ID Setup"],
      parsedDetails: {
        name: "Elena Rostova",
        email: "elena.rostova@cyberguard.net",
        phone: "+1 (555) 219-9080",
        summary: "Information Security Architect focused on zero-trust clusters, perimeter mitigation, cloud architecture hardening, and OWASP compliance auditing.",
        skills: ["CISSP", "Penetration Testing", "Threat Modeling", "IAM", "OWASP", "Kube-Hunter", "Terraform", "WIreshark", "Linux", "SOC2", "Kubernetes", "Snort"],
        experience: [
          {
            role: "Lead Cyber Security Architect",
            company: "Sentinel Cyber Inc.",
            duration: "2022 - Present",
            description: "Reconstructed secure ingress architectures for 80+ nodes. Integrated automated threat hunting scripts in GitLab CI pipelines, trapping 95% of Zero-Day vulnerability risks."
          },
          {
            role: "SecOps Compliance Analyst",
            company: "Federal Grid Systems",
            duration: "2019 - 2022",
            description: "Engineered single-sign-on MFA parameters protecting 4,000+ internal workstations. Conducted threat simulation audits raising standard defense awareness markers by 50%."
          }
        ],
        education: [
          {
            degree: "Bachelor of Science in Cybersecurity",
            school: "University of Maryland",
            duration: "2015 - 2019"
          }
        ],
        formattingQuality: 88,
        skillsCoverage: 85,
        experienceRelevance: 90,
        educationRelevance: 82,
        hrQuestions: [
          "Describe how you explain critical but complex security requirements to lazy developers who want to skip compliance.",
          "How do you stay updated with emerging state-sponsored zero-day threat patterns?"
        ],
        technicalQuestions: [
          "How would you lock down communication pathways between two microservices inside a default Kubernetes namespace?",
          "Explain the difference between Symmetric vs Asymmetric key distribution in TLS handshakes."
        ],
        behavioralQuestions: [
          "Describe an active hack or cyber incident you had to resolve in real-time. How did you coordinate response?",
          "What is your strategy for assessing the security standard of a third-party software vendor?"
        ]
      },
      match: {
        jobTitle: "Lead Infrastructure Security Architect",
        companyName: "CrowdStrike",
        jobDescription: "Seeking a senior expert to audit multi-tenant container spaces, structure zero-trust credential distribution, and lead internal purple-team security activities. CISSP expected.",
        matchScore: 89,
        fitSummary: "Elena's container shielding and high-fidelity automated scanning backgrounds match perfectly with CrowdStrike's security mission.",
        strengths: ["CISSP certification active", "Comprehensive hands-on experience in K8s container shielding", "Strong pipeline security tracking"],
        gaps: ["Lower compliance experience in SaaS financial standards", "No active government security clearances mentioned"],
        applicationStrategy: "Highlight your container isolation experience (Kube-Hunter, Calico network policies). Present yourself as a pipeline shield champion."
      },
      interview: {
        category: "Cloud Security & Threat Mitigation",
        questions: [
          "How would you prevent container escape vulnerabilities on Linux system kernels?",
          "How do you design an ephemeral secret generation system in HashiCorp Vault?",
          "Describe how you would audit an exposed IAM bucket that leaked data.",
          "What is your approach to threat modeling a distributed GraphQL client federation?"
        ]
      }
    },
    {
      id: "cv-amir-saeed-2026",
      fileName: "Amir_Saeed_Creative_Director.pdf",
      score: 79,
      grammarScore: 85,
      impactScore: 75,
      skillsScore: 80,
      summary: "Award-winning Creative Director & UI/UX Expert with 9+ years crafting delightful Web3, mobile, and enterprise developer design frameworks. Proven system architect driving complex component libraries inside Figma.",
      strengths: [
        "Phenomenal eye-catching digital design portfolio metrics",
        "Exceptional master of mobile-first UI typography pairing",
        "Detailed experience managing design token distributions"
      ],
      weaknesses: [
        "A standard text CV lacks visual expression markers",
        "Fewer references to hardcore data or back-end integration constructs"
      ],
      atsOptimizations: [
        "Add front-end developer terms like TailwindCSS to increase alignment score",
        "Refer to user conversion optimization outcomes explicitly"
      ],
      recommendations: [
        "Ensure design handoff metrics (such as Storybook and Zeplin) are cited within experience blocks",
        "List high-profile design awards or public UI component releases"
      ],
      skillsMatched: ["Figma", "Design Systems", "Prototyping", "User Research", "Wireframing", "Tailwind"],
      skillsMissing: ["React component development", "A11y (WCAG Compliance) testing methodologies", "Framer Motion"],
      parsedDetails: {
        name: "Amir Al-Saeed",
        email: "amir.saeed@pixelsandsignals.com",
        phone: "+1 (555) 831-2940",
        summary: "Creative Director specializing in scalable brand languages, design tokens, micro-interactions, Figma architectures, and conversion UI/UX loops.",
        skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Adobe Suite", "Webflow", "HTML/CSS", "Wireframing", "Tailwind", "User Testing", "Interactive Prototyping"],
        experience: [
          {
            role: "Creative Design Director",
            company: "DesignLabs Group",
            duration: "2021 - Present",
            description: "Pioneered redesign strategies for enterprise SaaS platform. Doubled core landing-page click-rates and coordinated handoff configurations for a 20-person frontend developer squad."
          },
          {
            role: "Lead Interaction Desinger",
            company: "CryptoSphere Systems",
            duration: "2018 - 2021",
            description: "Developed comprehensive Figma layout guides. Successfully automated dev design alignment checks, eliminating standard designer-engineer discrepancies by 65%."
          }
        ],
        education: [
          {
            degree: "Bachelor of Arts in Fine Arts & Interactive Design",
            school: "Rhode Island School of Design (RISD)",
            duration: "2013 - 2017"
          }
        ],
        formattingQuality: 82,
        skillsCoverage: 78,
        experienceRelevance: 80,
        educationRelevance: 78,
        hrQuestions: [
          "How do you handle developers saying your creative designs are too difficult or expensive to program?",
          "Explain your design process for simplifying a highly dense data-rich interface."
        ],
        technicalQuestions: [
          "Explain how you structure nested auto-layout components and variables inside Figma.",
          "Describe how your design token structures compile into native CSS/Sass variables for developers."
        ],
        behavioralQuestions: [
          "Describe a product launch where user testing completely invalidated your design. How did you react?",
          "How do you advocate for creative design budgets at the executive board level?"
        ]
      },
      match: {
        jobTitle: "Principal Design Systems Lead",
        companyName: "Airbnb",
        jobDescription: "Seeking an elite Interaction Designer to coordinate a global developer design language, refine responsive tokens, and build adaptive mobile components. Figma expertise required.",
        matchScore: 84,
        fitSummary: "Amir's background leading complex Figma workflows for SaaS platforms aligns very nicely with Airbnb's product aesthetics.",
        strengths: ["9+ years enterprise creative experience", "Outstanding Figma token structures background", "High conversion outcomes demonstrated"],
        gaps: ["Lacks formal frontend coding expertise inside React", "No extensive native Android/iOS handoff references"],
        applicationStrategy: "Submit a highly polished portfolio along with this resume. Emphasize designer-developer feedback loop automations."
      },
      interview: {
        category: "Creative UI/UX & Design Systems",
        questions: [
          "How do you design accessible experiences complying with strict WCAG AA rules?",
          "Walk me through your visual architecture of nested design token variables in Figma.",
          "What is your strategy for assessing design token mapping consistency across web & native platforms?",
          "Describe a UX critique session that went completely off the rails and how you salvaged it."
        ]
      }
    }
  ];

  // 4. Seeding CVs, Matches, and Interview sessions
  for (const prof of profiles) {
    const cvUniqueId = prof.id;
    console.log(`📎 Inserting CV record: "${prof.fileName}"...`);
    const { error: cvErr } = await supabase.from("cvs").insert([{
      id: cvUniqueId,
      userId: userId,
      fileName: prof.fileName,
      status: "analyzed",
      score: prof.score,
      grammarScore: prof.grammarScore,
      impactScore: prof.impactScore,
      skillsScore: prof.skillsScore,
      summary: prof.summary,
      suggestions: prof.recommendations,
      strengths: prof.strengths,
      weaknesses: prof.weaknesses,
      atsOptimizations: prof.atsOptimizations,
      recommendations: prof.recommendations,
      skillsMatched: prof.skillsMatched,
      skillsMissing: prof.skillsMissing,
      parsedDetails: prof.parsedDetails,
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 3600 * 1000).toISOString()
    }]);

    if (cvErr) {
      console.error(`❌ CV creation failed for ${prof.fileName}:`, cvErr);
      process.exit(1);
    }

    // A. Create Cover Letter
    console.log(`✉️ Inserting Cover Letter for CV "${prof.fileName}"...`);
    const docText = `
[Candidate Name]
[Address References]

Dear Hiring Manager,

I am writing to express my eager interest in the [Job Title] role at [Company Name]. Having followed [Company Name]'s growth, I am deeply inspired by your focus on precision, robust scale, and customer satisfaction.

In my recent capacity at my preceding station, I successfully led architectures driving considerable strategic outcomes. My primary skillset in core domain tools aligns beautifully with your explicit requisites. For instance, I successfully led optimizations that resulted in highly noted efficiency transformations.

I am enthusiastic about the opportunity to partner with your dedicated team to build top-tier systems. Thank you for your consideration, and I look forward to our conversation.

Sincerest regards,
[Name]
    `.replace("[Job Title]", prof.match.jobTitle)
     .replace("[Company Name]", prof.match.companyName)
     .replace("[Name]", prof.parsedDetails.name);

    const { error: letterErr } = await supabase.from("cover_letters").insert([{
      id: `letter-${cvUniqueId}`,
      cvId: cvUniqueId,
      userId: userId,
      recipientName: "Hiring Manager",
      companyName: prof.match.companyName,
      jobTitle: prof.match.jobTitle,
      jobDescription: prof.match.jobDescription,
      generatedText: docText,
      status: "completed",
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 3600 * 1000).toISOString()
    }]);

    if (letterErr) {
      console.error(`❌ Cover letter failed for ${prof.fileName}:`, letterErr);
      process.exit(1);
    }

    // B. Create Job Match
    console.log(`🎯 Inserting Job Match and Custom Job record...`);
    const customJobObj = {
      id: `job-rec-${cvUniqueId}`,
      title: prof.match.jobTitle,
      company: prof.match.companyName,
      location: "Remote / Hybrid US",
      salary: "$140,000 - $185,000",
      type: "Full-Time",
      requirements: prof.skillsMatched,
      description: prof.match.jobDescription
    };

    const { error: matchErr } = await supabase.from("matches").insert([{
      id: `match-${cvUniqueId}`,
      cvId: cvUniqueId,
      jobId: customJobObj.id,
      customJob: customJobObj,
      matchScore: prof.match.matchScore,
      fitSummary: prof.match.fitSummary,
      strengths: prof.match.strengths,
      gaps: prof.match.gaps,
      applicationStrategy: prof.match.applicationStrategy,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 4) * 24 * 3600 * 1000).toISOString()
    }]);

    if (matchErr) {
      console.error(`❌ Match creation failed for ${prof.fileName}:`, matchErr);
      process.exit(1);
    }

    // C. Associate Saved Bookmark activity for Dashboard bookmark visualization
    console.log(`⭐ Bookmarking match: "match-${cvUniqueId}" on dashboard...`);
    await supabase.from("activities").insert([{
      id: `saved-act-${cvUniqueId}`,
      userId: userId,
      tenantId: tenantId,
      type: "saved_job",
      message: `match-${cvUniqueId}`,
      timestamp: new Date().toISOString()
    }]);

    // D. Create Interview Questions Saved Activity Session
    console.log(`🧠 Inserting Saved Interview Session...`);
    const interviewRecord = {
      id: `iq-act-${cvUniqueId}`,
      userId: userId,
      tenantId: tenantId,
      type: "interview_questions",
      message: JSON.stringify({
        cvId: cvUniqueId,
        category: prof.interview.category,
        questions: prof.interview.questions
      }),
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 3600 * 1000).toISOString()
    };

    const { error: prepErr } = await supabase.from("activities").insert([interviewRecord]);
    if (prepErr) {
      console.error(`❌ Interview prep activity insertion failed for ${prof.fileName}:`, prepErr);
      process.exit(1);
    }

    // E. General Activity Telemetry Feed log
    console.log(`📈 Logging general telemetry activity logs for event metrics...`);
    await supabase.from("activities").insert([
      {
        id: `log-act-1-${cvUniqueId}`,
        userId: userId,
        tenantId: tenantId,
        type: "upload",
        message: `Parsed candidate document standard: "${prof.fileName}" for profile parsing.`,
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      },
      {
        id: `log-act-2-${cvUniqueId}`,
        userId: userId,
        tenantId: tenantId,
        type: "analysis",
        message: `Completed ATS Compliance Audit for: "${prof.fileName}" scoring ${prof.score}% compatibility.`,
        timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString()
      },
      {
        id: `log-act-3-${cvUniqueId}`,
        userId: userId,
        tenantId: tenantId,
        type: "letter",
        message: `Generated custom tailored cover letter draft for role at ${prof.match.companyName}.`,
        timestamp: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString()
      }
    ]);
  }

  console.log("\n🎉 Seeding complete! Credentials ready for your PFE defense board.");
  console.log(`📧 Login: ${email}`);
  console.log(`🔑 Password: ${password}`);
  process.exit(0);
}

runSeed();
