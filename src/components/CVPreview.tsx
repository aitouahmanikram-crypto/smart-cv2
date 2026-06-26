import React from 'react';
import { X, FileText, Briefcase, GraduationCap, Code, Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface CVPreviewProps {
  parsedDetails: any;
  onClose: () => void;
}

export default function CVPreview({ parsedDetails, onClose }: CVPreviewProps) {
  if (!parsedDetails) return null;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = margin;

    // Header styling
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(parsedDetails.name || "Curriculum Vitae", margin, 25);
    
    currentY = 50;
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(12);

    if (parsedDetails.email) doc.text(`Email: ${parsedDetails.email}`, margin, currentY);
    if (parsedDetails.phone) doc.text(`Phone: ${parsedDetails.phone}`, margin + 100, currentY);
    currentY += 15;

    // Skills
    if (parsedDetails.skills && parsedDetails.skills.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Skills", margin, currentY);
      currentY += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const skillsStr = parsedDetails.skills.join(", ");
      const splitSkills = doc.splitTextToSize(skillsStr, pageWidth - margin * 2);
      doc.text(splitSkills, margin, currentY);
      currentY += (splitSkills.length * 6) + 10;
    }

    // Experience
    if (parsedDetails.experience && parsedDetails.experience.length > 0) {
      if (currentY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); currentY = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Experience", margin, currentY);
      currentY += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      parsedDetails.experience.forEach((exp: string) => {
        const splitExp = doc.splitTextToSize(exp, pageWidth - margin * 2);
        if (currentY + (splitExp.length * 5) > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          currentY = margin;
        }
        doc.text(splitExp, margin, currentY);
        currentY += (splitExp.length * 5) + 6;
      });
      currentY += 4;
    }

    // Education
    if (parsedDetails.education && parsedDetails.education.length > 0) {
      if (currentY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); currentY = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Education", margin, currentY);
      currentY += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      parsedDetails.education.forEach((edu: string) => {
        const splitEdu = doc.splitTextToSize(edu, pageWidth - margin * 2);
        if (currentY + (splitEdu.length * 5) > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          currentY = margin;
        }
        doc.text(splitEdu, margin, currentY);
        currentY += (splitEdu.length * 5) + 6;
      });
    }

    doc.save("CV_Profile.pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Parsed CV Data</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
               onClick={handleDownloadPDF}
               className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
               <Download className="h-4 w-4" /> Export PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-xl border border-slate-800/50">
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-1">Full Name</h3>
              <p className="text-lg text-white font-medium">{parsedDetails.name || 'Not extracted'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-1">Contact Information</h3>
              <p className="text-white">{parsedDetails.email || 'No email'}</p>
              <p className="text-slate-300">{parsedDetails.phone || 'No phone'}</p>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Code className="h-5 w-5 text-indigo-400" /> Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {parsedDetails.skills?.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-sm font-medium">
                  {skill}
                </span>
              ))}
              {(!parsedDetails.skills || parsedDetails.skills.length === 0) && (
                <p className="text-slate-400">No skills parsed.</p>
              )}
            </div>
          </div>

          {/* Experience */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-400" /> Experience
            </h3>
            <div className="space-y-4">
              {parsedDetails.experience?.map((exp: string, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-800/30">
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{exp}</p>
                </div>
              ))}
              {(!parsedDetails.experience || parsedDetails.experience.length === 0) && (
                <p className="text-slate-400">No experience blocks parsed.</p>
              )}
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-400" /> Education
            </h3>
            <div className="space-y-4">
              {parsedDetails.education?.map((edu: string, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-800/30">
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{edu}</p>
                </div>
              ))}
              {(!parsedDetails.education || parsedDetails.education.length === 0) && (
                <p className="text-slate-400">No education blocks parsed.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
