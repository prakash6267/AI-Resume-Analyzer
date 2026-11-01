import React, { useState } from 'react';
import { 
  Plus, Trash2, Sparkles, User, FileText, Wrench, Briefcase, 
  GraduationCap, FolderGit2, Award, Loader2, Check, ArrowRight
} from 'lucide-react';
import { refineResumeSection } from '../api/client';
import { useResume } from '../state/ResumeContext';

export default function SectionEditor() {
  const { resume, setResume } = useResume();
  const [refiningSection, setRefiningSection] = useState(null); // 'summary' | 'experience' | 'projects' | 'skills'
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState('');

  // Handle AI Refine
  const handleRefine = async (sectionName) => {
    if (!refineInstruction.trim()) return;

    setIsRefining(true);
    setRefineFeedback('');
    try {
      const updated = await refineResumeSection({
        resume,
        section: sectionName,
        instruction: refineInstruction
      });
      setResume(updated);
      setRefineFeedback('Section refined successfully!');
      setTimeout(() => {
        setRefiningSection(null);
        setRefineInstruction('');
        setRefineFeedback('');
      }, 1000);
    } catch (err) {
      setRefineFeedback(err.response?.data?.detail || 'AI service is busy, please try again in a minute.');
    } finally {
      setIsRefining(false);
    }
  };

  // Personal Info helpers
  const handlePersonalChange = (field, val) => {
    setResume(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: val }
    }));
  };

  // Skills helpers
  const addSkillCategory = () => {
    setResume(prev => ({
      ...prev,
      skills: [...prev.skills, { category: "New Category", items: [] }]
    }));
  };

  const removeSkillCategory = (idx) => {
    setResume(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== idx)
    }));
  };

  const updateSkillCategoryName = (idx, name) => {
    setResume(prev => {
      const newSkills = [...prev.skills];
      newSkills[idx].category = name;
      return { ...prev, skills: newSkills };
    });
  };

  const addSkillItem = (catIdx, itemText) => {
    if (!itemText.trim()) return;
    setResume(prev => {
      const newSkills = [...prev.skills];
      if (!newSkills[catIdx].items.includes(itemText.trim())) {
        newSkills[catIdx].items.push(itemText.trim());
      }
      return { ...prev, skills: newSkills };
    });
  };

  const removeSkillItem = (catIdx, itemIdx) => {
    setResume(prev => {
      const newSkills = [...prev.skills];
      newSkills[catIdx].items = newSkills[catIdx].items.filter((_, i) => i !== itemIdx);
      return { ...prev, skills: newSkills };
    });
  };

  // Experience helpers
  const addExperienceItem = () => {
    setResume(prev => ({
      ...prev,
      experience: [...prev.experience, { title: "", company: "", location: "", start: "", end: "", bullets: [""] }]
    }));
  };

  const removeExperienceItem = (idx) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx)
    }));
  };

  const updateExperienceField = (idx, field, val) => {
    setResume(prev => {
      const newExp = [...prev.experience];
      newExp[idx][field] = val;
      return { ...prev, experience: newExp };
    });
  };

  const addExperienceBullet = (expIdx) => {
    setResume(prev => {
      const newExp = [...prev.experience];
      newExp[expIdx].bullets.push("");
      return { ...prev, experience: newExp };
    });
  };

  const updateExperienceBullet = (expIdx, bIdx, val) => {
    setResume(prev => {
      const newExp = [...prev.experience];
      newExp[expIdx].bullets[bIdx] = val;
      return { ...prev, experience: newExp };
    });
  };

  const removeExperienceBullet = (expIdx, bIdx) => {
    setResume(prev => {
      const newExp = [...prev.experience];
      newExp[expIdx].bullets = newExp[expIdx].bullets.filter((_, i) => i !== bIdx);
      return { ...prev, experience: newExp };
    });
  };

  // Projects helpers
  const addProjectItem = () => {
    setResume(prev => ({
      ...prev,
      projects: [...prev.projects, { name: "", tech: [], link: "", bullets: [""] }]
    }));
  };

  const removeProjectItem = (idx) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx)
    }));
  };

  const updateProjectField = (idx, field, val) => {
    setResume(prev => {
      const newProj = [...prev.projects];
      newProj[idx][field] = val;
      return { ...prev, projects: newProj };
    });
  };

  const addProjectBullet = (projIdx) => {
    setResume(prev => {
      const newProj = [...prev.projects];
      newProj[projIdx].bullets.push("");
      return { ...prev, projects: newProj };
    });
  };

  const updateProjectBullet = (projIdx, bIdx, val) => {
    setResume(prev => {
      const newProj = [...prev.projects];
      newProj[projIdx].bullets[bIdx] = val;
      return { ...prev, projects: newProj };
    });
  };

  const removeProjectBullet = (projIdx, bIdx) => {
    setResume(prev => {
      const newProj = [...prev.projects];
      newProj[projIdx].bullets = newProj[projIdx].bullets.filter((_, i) => i !== bIdx);
      return { ...prev, projects: newProj };
    });
  };

  // Education helpers
  const addEducationItem = () => {
    setResume(prev => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", start_year: "", end_year: "", score: "", details: "" }]
    }));
  };

  const removeEducationItem = (idx) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx)
    }));
  };

  const updateEducationField = (idx, field, val) => {
    setResume(prev => {
      const newEdu = [...prev.education];
      newEdu[idx][field] = val;
      return { ...prev, education: newEdu };
    });
  };

  // Certifications & Achievements
  const addCertification = () => {
    setResume(prev => ({ ...prev, certifications: [...prev.certifications, ""] }));
  };
  const updateCertification = (idx, val) => {
    setResume(prev => {
      const list = [...prev.certifications];
      list[idx] = val;
      return { ...prev, certifications: list };
    });
  };
  const removeCertification = (idx) => {
    setResume(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== idx) }));
  };

  const addAchievement = () => {
    setResume(prev => ({ ...prev, achievements: [...prev.achievements, ""] }));
  };
  const updateAchievement = (idx, val) => {
    setResume(prev => {
      const list = [...prev.achievements];
      list[idx] = val;
      return { ...prev, achievements: list };
    });
  };
  const removeAchievement = (idx) => {
    setResume(prev => ({ ...prev, achievements: prev.achievements.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Target Role & Personal Information Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Personal & Target Role</h3>
            <p className="text-xs text-slate-500">Contact details and target job title</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Role *</label>
            <input
              type="text"
              value={resume.target_role || ''}
              onChange={(e) => setResume(prev => ({ ...prev, target_role: e.target.value }))}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={resume.personal?.full_name || ''}
              onChange={(e) => handlePersonalChange('full_name', e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={resume.personal?.email || ''}
              onChange={(e) => handlePersonalChange('email', e.target.value)}
              placeholder="e.g. alex@example.com"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
            <input
              type="text"
              value={resume.personal?.phone || ''}
              onChange={(e) => handlePersonalChange('phone', e.target.value)}
              placeholder="e.g. +1 (555) 019-2834"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location (City, State / Country)</label>
            <input
              type="text"
              value={resume.personal?.location || ''}
              onChange={(e) => handlePersonalChange('location', e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile</label>
            <input
              type="text"
              value={resume.personal?.linkedin || ''}
              onChange={(e) => handlePersonalChange('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/alexmorgan"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Profile</label>
            <input
              type="text"
              value={resume.personal?.github || ''}
              onChange={(e) => handlePersonalChange('github', e.target.value)}
              placeholder="https://github.com/alexmorgan"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio / Website</label>
            <input
              type="text"
              value={resume.personal?.portfolio || ''}
              onChange={(e) => handlePersonalChange('portfolio', e.target.value)}
              placeholder="https://alexmorgan.dev"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Professional Summary Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Professional Summary</h3>
              <p className="text-xs text-slate-500">2-4 lines highlighting core specializations</p>
            </div>
          </div>
          <button
            onClick={() => setRefiningSection(refiningSection === 'summary' ? null : 'summary')}
            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Regenerate with AI</span>
          </button>
        </div>

        {/* Refine Box */}
        {refiningSection === 'summary' && (
          <div className="mb-4 p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl animate-in fade-in duration-200">
            <label className="block text-xs font-bold text-indigo-900 mb-1">
              AI Refinement Instruction for Summary:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                placeholder="e.g. Make it more concise, emphasize Python and cloud architecture"
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                onClick={() => handleRefine('summary')}
                disabled={isRefining}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1"
              >
                {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Apply</span>
              </button>
            </div>
            {refineFeedback && <p className="text-xs font-medium text-indigo-800 mt-2">{refineFeedback}</p>}
          </div>
        )}

        <textarea
          rows={4}
          value={resume.summary || ''}
          onChange={(e) => setResume(prev => ({ ...prev, summary: e.target.value }))}
          placeholder="Results-driven professional with expertise in..."
          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
        />
      </div>

      {/* 3. Technical Skills Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Technical Skills</h3>
              <p className="text-xs text-slate-500">Grouped skill categories and keyword chips</p>
            </div>
          </div>
          <button
            onClick={addSkillCategory}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="space-y-4">
          {resume.skills?.map((cat, catIdx) => (
            <div key={catIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={cat.category}
                  onChange={(e) => updateSkillCategoryName(catIdx, e.target.value)}
                  placeholder="Category Name (e.g. Languages)"
                  className="font-semibold text-xs text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1 py-0.5 rounded outline-none"
                />
                <button
                  onClick={() => removeSkillCategory(catIdx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Skill chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {cat.items?.map((item, itemIdx) => (
                  <span
                    key={itemIdx}
                    className="inline-flex items-center space-x-1 bg-white border border-slate-300 text-slate-800 text-xs px-2.5 py-1 rounded-lg"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => removeSkillItem(catIdx, itemIdx)}
                      className="text-slate-400 hover:text-rose-600 ml-1"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              {/* Add item input */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  id={`skill-input-${catIdx}`}
                  placeholder="Type skill & press Add (e.g. Docker)"
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg flex-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkillItem(catIdx, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`skill-input-${catIdx}`);
                    if (el) {
                      addSkillItem(catIdx, el.value);
                      el.value = '';
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Work Experience Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Work Experience</h3>
              <p className="text-xs text-slate-500">Action verbs and quantified metrics</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setRefiningSection(refiningSection === 'experience' ? null : 'experience')}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Regenerate with AI</span>
            </button>
            <button
              onClick={addExperienceItem}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
          </div>
        </div>

        {/* Refine Box */}
        {refiningSection === 'experience' && (
          <div className="mb-4 p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl">
            <label className="block text-xs font-bold text-indigo-900 mb-1">
              AI Refinement Instruction for Experience:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                placeholder="e.g. Add stronger action verbs and emphasize quantifiable metrics"
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                onClick={() => handleRefine('experience')}
                disabled={isRefining}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1"
              >
                {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Apply</span>
              </button>
            </div>
            {refineFeedback && <p className="text-xs font-medium text-indigo-800 mt-2">{refineFeedback}</p>}
          </div>
        )}

        <div className="space-y-6">
          {resume.experience?.map((exp, expIdx) => (
            <div key={expIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Role #{expIdx + 1}
                </span>
                <button
                  onClick={() => removeExperienceItem(expIdx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => updateExperienceField(expIdx, 'title', e.target.value)}
                  placeholder="Job Title (e.g. Senior Software Engineer)"
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperienceField(expIdx, 'company', e.target.value)}
                  placeholder="Company Name (e.g. Google)"
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  value={exp.location || ''}
                  onChange={(e) => updateExperienceField(expIdx, 'location', e.target.value)}
                  placeholder="Location (e.g. Seattle, WA)"
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={exp.start}
                    onChange={(e) => updateExperienceField(expIdx, 'start', e.target.value)}
                    placeholder="Start (e.g. Jan 2022)"
                    className="w-1/2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    type="text"
                    value={exp.end}
                    onChange={(e) => updateExperienceField(expIdx, 'end', e.target.value)}
                    placeholder="End (e.g. Present)"
                    className="w-1/2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Bullets */}
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Achievement Bullets:</span>
                  <button
                    onClick={() => addExperienceBullet(expIdx)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Bullet</span>
                  </button>
                </div>

                {exp.bullets?.map((b, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2">
                    <span className="text-slate-400 mt-2 text-xs">•</span>
                    <textarea
                      rows={2}
                      value={b}
                      onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                      placeholder="Start with action verb: Engineered high-throughput API handling 2M requests..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      onClick={() => removeExperienceBullet(expIdx, bIdx)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Key Projects Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Key Projects</h3>
              <p className="text-xs text-slate-500">Technical portfolio and measurable contributions</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setRefiningSection(refiningSection === 'projects' ? null : 'projects')}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Regenerate with AI</span>
            </button>
            <button
              onClick={addProjectItem}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* Refine Box */}
        {refiningSection === 'projects' && (
          <div className="mb-4 p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl">
            <label className="block text-xs font-bold text-indigo-900 mb-1">
              AI Refinement Instruction for Projects:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                placeholder="e.g. Focus on system architecture and quantifiable speedups"
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                onClick={() => handleRefine('projects')}
                disabled={isRefining}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1"
              >
                {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Apply</span>
              </button>
            </div>
            {refineFeedback && <p className="text-xs font-medium text-indigo-800 mt-2">{refineFeedback}</p>}
          </div>
        )}

        <div className="space-y-6">
          {resume.projects?.map((proj, projIdx) => (
            <div key={projIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Project #{projIdx + 1}
                </span>
                <button
                  onClick={() => removeProjectItem(projIdx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={proj.name}
                  onChange={(e) => updateProjectField(projIdx, 'name', e.target.value)}
                  placeholder="Project Name (e.g. Real-Time Chat System)"
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  value={proj.link || ''}
                  onChange={(e) => updateProjectField(projIdx, 'link', e.target.value)}
                  placeholder="Project Link (e.g. https://github.com/alex/chat)"
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  value={proj.tech?.join(', ') || ''}
                  onChange={(e) => updateProjectField(projIdx, 'tech', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Tech Stack comma separated (e.g. React, Node.js, WebSockets, Redis)"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Project Bullets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Project Highlights:</span>
                  <button
                    onClick={() => addProjectBullet(projIdx)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Highlight</span>
                  </button>
                </div>

                {proj.bullets?.map((b, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2">
                    <span className="text-slate-400 mt-2 text-xs">•</span>
                    <textarea
                      rows={2}
                      value={b}
                      onChange={(e) => updateProjectBullet(projIdx, bIdx, e.target.value)}
                      placeholder="Built event-driven pipeline delivering 50k messages/sec..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      onClick={() => removeProjectBullet(projIdx, bIdx)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Education Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Education</h3>
              <p className="text-xs text-slate-500">Degrees, institutions, and academic highlights</p>
            </div>
          </div>
          <button
            onClick={addEducationItem}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Degree</span>
          </button>
        </div>

        <div className="space-y-4">
          {resume.education?.map((edu, eduIdx) => (
            <div key={eduIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Degree #{eduIdx + 1}
                </span>
                <button
                  onClick={() => removeEducationItem(eduIdx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducationField(eduIdx, 'degree', e.target.value)}
                  placeholder="Degree (e.g. B.S. in Computer Science)"
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => updateEducationField(eduIdx, 'institution', e.target.value)}
                  placeholder="Institution (e.g. UC Berkeley)"
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={edu.start_year}
                    onChange={(e) => updateEducationField(eduIdx, 'start_year', e.target.value)}
                    placeholder="Start Year (2018)"
                    className="w-1/2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    type="text"
                    value={edu.end_year}
                    onChange={(e) => updateEducationField(eduIdx, 'end_year', e.target.value)}
                    placeholder="Grad Year (2022)"
                    className="w-1/2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={edu.score || ''}
                    onChange={(e) => updateEducationField(eduIdx, 'score', e.target.value)}
                    placeholder="GPA / Score (e.g. 8.8 or 3.9)"
                    className="w-1/2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <select
                    value={edu.cgpa_scale || "/10.0"}
                    onChange={(e) => updateEducationField(eduIdx, 'cgpa_scale', e.target.value)}
                    className="w-1/2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="/10.0">Scale: /10.0</option>
                    <option value="/4.0">Scale: /4.0</option>
                    <option value="%">Scale: %</option>
                    <option value="">No Scale</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={edu.coursework?.join(', ') || ''}
                  onChange={(e) => updateEducationField(eduIdx, 'coursework', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Coursework (comma separated, e.g. Data Structures, Distributed Systems)"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  value={edu.details || ''}
                  onChange={(e) => updateEducationField(eduIdx, 'details', e.target.value)}
                  placeholder="Honors / details (e.g. Dean's List, First Class with Distinction)"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Certifications & Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Certifications */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Certifications</h3>
            </div>
            <button
              onClick={addCertification}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2">
            {resume.certifications?.map((cert, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cert}
                  onChange={(e) => updateCertification(idx, e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={() => removeCertification(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Achievements</h3>
            </div>
            <button
              onClick={addAchievement}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center space-x-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2">
            {resume.achievements?.map((ach, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={ach}
                  onChange={(e) => updateAchievement(idx, e.target.value)}
                  placeholder="e.g. 1st Place at National Hackathon (out of 400+ teams)"
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  onClick={() => removeAchievement(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
