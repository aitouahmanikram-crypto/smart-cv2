import React from "react";
import { Sparkles, FileText, CheckCircle, ArrowRight, Target, Bot, Zap, Star, ShieldCheck, ChevronRight, Upload, Search, Download } from "lucide-react";
import { motion } from "framer-motion";

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register') => void;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="bg-[#0a0f1c] text-slate-200 min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden font-sans">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none blur-[100px]" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-indigo-600/5 pointer-events-none rounded-full blur-[120px]" />

      {/* Navigation Headers */}
      <header className="border-b border-white/5 backdrop-blur-xl sticky top-0 z-50 bg-[#0a0f1c]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-white">SmartCV <span className="text-indigo-400">AI</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </nav>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('login')}
              className="text-sm font-medium text-slate-300 hover:text-white py-2 px-4 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="text-sm font-semibold bg-white text-slate-900 hover:bg-slate-100 py-2 px-5 rounded-md transition-all flex items-center gap-1.5 shadow-sm"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Powered by state-of-the-art AI
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
            Upgrade Your CV With AI
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Stop guessing what hiring managers want. Our AI decodes recruitment requirements, instantly scores your resume, and optimizes it for your dream job.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold tracking-wide shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              Optimize Your Resume
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 font-medium transition-colors flex items-center justify-center gap-2"
            >
              See How It Works
            </a>
          </div>
        </motion.div>

        {/* Hero Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-5xl rounded-xl border border-white/10 bg-[#0d1326] p-2 sm:p-4 shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="rounded-lg border border-white/5 bg-[#0a0f1c] overflow-hidden flex flex-col md:flex-row text-left">
            <div className="w-full md:w-1/3 border-r border-white/5 p-6 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">EC</div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Elena Chen</h4>
                  <p className="text-xs text-slate-500">Product Designer</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Match Score</span>
                    <span className="text-emerald-400 font-bold">92%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">ATS Formatting</span>
                    <span className="text-indigo-400 font-bold">85%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-[85%]" />
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <h5 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">Missing Skills</h5>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px]">Framer</span>
                  <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px]">Design Systems</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-2/3 p-6">
               <h5 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-400" /> AI Recommendations</h5>
               <div className="space-y-4">
                 <div className="p-4 bg-white/[0.03] border border-white/5 rounded-lg">
                   <p className="text-xs text-slate-400 mb-2 line-through">"Designed interfaces for mobile apps."</p>
                   <p className="text-sm text-slate-200">"Spearheaded end-to-end UX design for 3 mobile applications, increasing user retention by 24% over 6 months."</p>
                 </div>
                 <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                   <p className="text-xs text-indigo-300/70 mb-2 font-mono">Suggested Action</p>
                   <p className="text-sm text-indigo-200">Add a summary section highlighting your transition from standard UI work to overarching product strategy.</p>
                 </div>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
          >
            {[
              { text: "Beat the ATS systems with algorithm-friendly formatting.", icon: ShieldCheck, color: "text-emerald-400" },
              { text: "Tailor applications for each role in a matter of seconds.", icon: Target, color: "text-indigo-400" },
              { text: "Identify your skill gaps before the hiring manager does.", icon: Search, color: "text-rose-400" },
              { text: "Generate executive-level cover letters automatically.", icon: FileText, color: "text-purple-400" }
            ].map((benefit, i) => (
               <motion.div key={i} variants={fadeIn} className="flex flex-col items-center text-center space-y-4">
                 <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                   <benefit.icon className={`h-5 w-5 ${benefit.color}`} />
                 </div>
                 <p className="text-sm text-slate-300 font-medium leading-relaxed">{benefit.text}</p>
               </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Outline */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Complete Your Application Arsenal</h2>
          <p className="text-slate-400">Everything required to transition from applicant to top candidate.</p>
        </div>

        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div variants={fadeIn} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <Bot className="h-8 w-8 text-indigo-400 mb-6" />
            <h3 className="text-lg font-bold text-white mb-3">AI CV Rewriter</h3>
            <p className="text-sm text-slate-400 leading-relaxed drop-shadow-sm">
              Transform passive bullet points into impactful, metric-driven achievements using our highly tuned executive AI models.
            </p>
          </motion.div>
          <motion.div variants={fadeIn} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors md:-translate-y-4">
            <Zap className="h-8 w-8 text-emerald-400 mb-6" />
            <h3 className="text-lg font-bold text-white mb-3">Job Match Analysis</h3>
            <p className="text-sm text-slate-400 leading-relaxed drop-shadow-sm">
              Paste a job description and instantly see your fit percentage, missing tools, and exact strategies to align your profile.
            </p>
          </motion.div>
          <motion.div variants={fadeIn} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <FileText className="h-8 w-8 text-purple-400 mb-6" />
            <h3 className="text-lg font-bold text-white mb-3">Cover Letter Generator</h3>
            <p className="text-sm text-slate-400 leading-relaxed drop-shadow-sm">
              Stop writing the same letter over and over. Generate professional, personalized cover letters perfectly matched to the job and your CV.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-[#0d1326] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl md:text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">How it works</h2>
            <p className="mt-4 text-slate-400">Three simple steps to supercharge your job applications.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            {[
              { icon: Upload, title: "1. Upload your CV", desc: "Upload your current resume in PDF or plain text format." },
              { icon: Sparkles, title: "2. AI Analysis", desc: "Our engine parses your data, scores your format, and maps your abilities." },
              { icon: Download, title: "3. Export & Apply", desc: "Rewrite weak sections, generate your cover letter, and export clean PDFs." }
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-[#0a0f1c] border border-indigo-500/20 flex items-center justify-center relative z-10 mb-6 shadow-lg shadow-indigo-500/5">
                  <step.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-12 text-center">Loved by tech professionals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: "The Job Match analysis saved me hours. Tweaked my resume exactly where it told me, and landed an interview at a FAANG company the next week.", name: "David T.", role: "Backend Engineer" },
            { quote: "Cover letters used to take me 45 minutes each. Now they take 30 seconds, and they actually sound better than what I was writing.", name: "Sarah McCarthy", role: "Product Manager" },
            { quote: "The AI Rewriter completely transformed my experience section from boring task-lists to genuine executive achievements. 10/10.", name: "Jordan L.", role: "Data Scientist" },
          ].map((t, i) => (
             <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
               <div className="flex gap-1">
                 {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 text-yellow-500 fill-yellow-500" />)}
               </div>
               <p className="text-sm text-slate-300 italic flex-grow">"{t.quote}"</p>
               <div>
                 <p className="text-sm font-bold text-white">{t.name}</p>
                 <p className="text-xs text-slate-500">{t.role}</p>
               </div>
             </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 border-t border-white/5 bg-[#0a0f1c] overflow-hidden">
        <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6">Ready to stand out?</h2>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">Join the competitive edge of modern applicants. Create your account and optimize your resume today.</p>
          <button
            onClick={() => onNavigate('register')}
            className="px-8 py-4 bg-white text-slate-900 rounded-lg font-bold tracking-wide shadow-xl hover:bg-slate-100 transition-all text-lg"
          >
            Get Started For Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#0a0f1c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="font-bold tracking-tight text-white text-sm">SmartCV AI</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} SmartCV AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

