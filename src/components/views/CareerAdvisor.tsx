import React, { useEffect, useState } from "react";
import { Sparkles, Target, DollarSign, TrendingUp, BookOpen, CheckCircle } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

export default function CareerAdvisor({ cvId, token }: { cvId: string; token: string }) {
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAdvice() {
      try {
        const data = await apiFetch(`/api/career-advice/${cvId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        setAdvice(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAdvice();
  }, [cvId, token]);

  if (loading) return <div className="text-white text-sm">Generating career insights...</div>;
  if (error) return <div className="text-red-400 text-sm">Error: {error}</div>;
  if (!advice) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Career Paths */}
      <section>
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4 font-mono uppercase tracking-wider">
          <Target className="h-5 w-5 text-indigo-400" /> Suggested Career Paths
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {advice.career_paths.map((path: any, i: number) => (
            <div key={i} className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
              <h4 className="font-bold text-indigo-300 mb-2">{path.title}</h4>
              <p className="text-xs text-slate-400 mb-3">{path.description}</p>
              <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                <span>Match: {path.matchScore}%</span>
                <span>Demand: {path.demandLevel}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Salary */}
      <section>
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4 font-mono uppercase tracking-wider">
          <DollarSign className="h-5 w-5 text-emerald-400" /> Salary Estimation ({advice.salary_estimation.currency})
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {['junior', 'midLevel', 'senior'].map((level) => (
            <div key={level} className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{level}</div>
              <div className="text-base font-bold text-white">{advice.salary_estimation[level]}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">{advice.salary_estimation.explanation}</p>
      </section>

      {/* Skills Gap */}
      <section>
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4 font-mono uppercase tracking-wider">
          <TrendingUp className="h-5 w-5 text-amber-400" /> Skills Gap Analysis
        </h3>
        <div className="bg-slate-950 border border-slate-850 p-6 rounded-xl space-y-6">
          <div>
            <div className="text-xs text-slate-300 font-bold mb-2">Priority Skills</div>
            <div className="flex flex-wrap gap-2">
              {advice.skills_gap.prioritySkills.map((skill: string) => (
                <span key={skill} className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold uppercase">{skill}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-300 font-bold mb-2">Current Skills (Detected)</div>
            <div className="flex flex-wrap gap-2">
              {advice.skills_gap.currentSkills.map((skill: string) => (
                <span key={skill} className="px-2 py-1 bg-slate-900 text-slate-400 rounded text-[10px] font-bold uppercase">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section>
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4 font-mono uppercase tracking-wider">
          <BookOpen className="h-5 w-5 text-sky-400" /> Learning Roadmap
        </h3>
        <div className="space-y-4">
          {advice.roadmap.recommendedCourses.map((course: any, i: number) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="p-2 bg-sky-900/30 text-sky-400 rounded-lg">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{course.title}</h4>
                <p className="text-[10px] text-slate-400">{course.platform} • {course.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
