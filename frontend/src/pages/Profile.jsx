import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Save, User, Camera, Globe, Github, Linkedin, Twitter, X, Plus, Activity, CheckCircle2, XCircle,
    ShieldAlert, Zap, ArrowRight, Calendar as CalendarIcon, Mail, AlertCircle
} from 'lucide-react';
import { getProfile, updateProfile } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { token, user: authUser } = useAuth();

    // Form state — mirroring the ProfileUpdateRequest schema on the backend
    const [formData, setFormData] = useState({
        fullName: '',
        role: '',
        bio: '',
        // Email comes from the JWT; it's shown read-only and never sent in PUT body
        email: authUser?.email || '',
        socials: { github: '', twitter: '', linkedin: '', website: '' }
    });
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // Load the user's saved profile from the backend when the page mounts
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile(token);
                setFormData({
                    fullName: data.full_name || '',
                    role:     data.role      || '',
                    bio:      data.bio       || '',
                    email:    data.email     || authUser?.email || '',
                    socials: {
                        github:   data.socials?.github   || '',
                        twitter:  data.socials?.twitter  || '',
                        linkedin: data.socials?.linkedin  || '',
                        website:  data.socials?.website  || '',
                    }
                });
                setSkills(data.skills || []);
            } catch (err) {
                setError('Could not load your profile. Please refresh and try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [token]);

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && skillInput.trim() !== '') {
            e.preventDefault();
            if (!skills.includes(skillInput.trim())) {
                setSkills([...skills, skillInput.trim()]);
            }
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            // Build the payload that matches ProfileUpdateRequest — no email field
            const payload = {
                full_name: formData.fullName,
                role:      formData.role,
                bio:       formData.bio,
                skills:    skills,
                socials: {
                    github:   formData.socials.github,
                    linkedin: formData.socials.linkedin,
                    twitter:  formData.socials.twitter,
                    website:  formData.socials.website,
                },
            };
            await updateProfile(token, payload);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.message || 'Could not save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };


    // Animation variants for the Bento grid
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

  return (
    <div className="flex-1 w-full bg-[#f8fafc] font-sans h-full p-4 md:p-8">
      <div className="max-w-5xl mx-auto py-4">
                        
                        {/* Action Header */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
                                <p className="text-slate-500 mt-1">Manage your identity and technical footprint.</p>
                            </div>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold shadow-md transition-all w-full md:w-auto ${
                                    saved ? 'bg-emerald-500 text-white' : 'bg-black text-white hover:bg-gray-800 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                                }`}
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : saved ? (
                                    <><CheckCircle2 size={18} /> Saved!</>
                                ) : (
                                    <><Save size={18} /> Save Profile</>
                                )}
                            </button>
                        </div>

                        {/* Error banner */}
                        {error && (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-medium mb-6">
                                <AlertCircle size={18} className="shrink-0" />
                                <span className="flex-1">{error}</span>
                                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {isLoading && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 h-64" />
                                <div className="bg-white rounded-3xl border border-gray-200 h-64" />
                                <div className="bg-white rounded-3xl border border-gray-200 h-48" />
                                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 h-48" />
                            </div>
                        )}


                        {/* Bento Grid Layout — only shown once profile data has loaded */}
                        {!isLoading && (
                        <motion.div 
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >

                            {/* Card 1: Main Identity (Spans 2 columns) */}
                            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                                {/* Abstract Dark Cover Photo */}
                                <div className="h-32 bg-black relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />
                                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-slate-800 rounded-full blur-[80px] opacity-50" />
                                </div>
                                
                                <div className="px-8 pb-8 relative">
                                    {/* Overlapping Avatar */}
                                    <div className="relative inline-block -mt-12 mb-4">
                                        <div className="w-24 h-24 bg-white rounded-2xl p-1.5 shadow-lg">
                                            <div className="w-full h-full bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
                                                <User size={40} />
                                            </div>
                                        </div>
                                        <button className="absolute -bottom-2 -right-2 bg-white border border-gray-200 text-black p-2 rounded-full shadow-sm hover:bg-gray-50 transition-colors">
                                            <Camera size={14} />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                                    className="w-full text-lg font-bold text-slate-900 bg-transparent border-b-2 border-transparent focus:border-black focus:outline-none transition-colors pb-1"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Primary Role</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.role}
                                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                                    className="w-full text-lg font-bold text-slate-900 bg-transparent border-b-2 border-transparent focus:border-black focus:outline-none transition-colors pb-1"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Biography</label>
                                            <textarea 
                                                value={formData.bio}
                                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                                rows="2"
                                                className="w-full text-slate-600 bg-gray-50 border border-gray-100 rounded-xl p-4 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all outline-none resize-none leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 2: Contact & Email (Spans 1 column) */}
                            <motion.div variants={itemVariants} className="lg:col-span-1 bg-white rounded-3xl border border-gray-200 shadow-sm p-8 hover:shadow-md transition-shadow flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                                        <Mail size={20} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg">Contact</h3>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Primary Email</label>
                                        <input 
                                            type="email" 
                                            value={formData.email}
                                            readOnly
                                            className="w-full bg-gray-50 border border-gray-100 text-gray-500 rounded-xl p-4 outline-none cursor-not-allowed font-medium"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Contact IT admin to change primary email.</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 3: Social & Web Presence (Spans 1 column) */}
                            <motion.div variants={itemVariants} className="lg:col-span-1 bg-white rounded-3xl border border-gray-200 shadow-sm p-8 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                                        <Globe size={20} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg">Web Presence</h3>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { id: 'github', icon: Github, placeholder: 'github.com/username' },
                                        { id: 'linkedin', icon: Linkedin, placeholder: 'linkedin.com/in/username' },
                                        { id: 'twitter', icon: Twitter, placeholder: 'twitter.com/username' }
                                    ].map((social) => (
                                        <div key={social.id} className="relative flex items-center group">
                                            <div className="absolute left-4 text-gray-400 group-focus-within:text-black transition-colors">
                                                <social.icon size={18} />
                                            </div>
                                            <input 
                                                type="text"
                                                placeholder={social.placeholder}
                                                value={formData.socials[social.id]}
                                                onChange={(e) => setFormData({
                                                    ...formData, 
                                                    socials: {...formData.socials, [social.id]: e.target.value}
                                                })}
                                                className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-black focus:ring-1 focus:ring-black rounded-xl py-3.5 pl-12 pr-4 transition-all outline-none text-sm font-medium text-slate-700"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Card 4: Skills & Tech Stack (Spans 2 columns) */}
                            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-8 hover:shadow-md transition-shadow flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-black text-white rounded-lg">
                                        <Zap size={20} className="fill-current" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">Technical Arsenal</h3>
                                        <p className="text-xs text-gray-500">Skills are used by the Planner Agent to assign tasks.</p>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex flex-wrap gap-2 mb-6 min-h-[80px] content-start">
                                        <AnimatePresence mode="popLayout">
                                            {skills.map((skill) => (
                                                <motion.span 
                                                    key={skill}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    className="flex items-center gap-1.5 bg-gray-100 text-slate-800 border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:border-gray-300 transition-colors group"
                                                >
                                                    {skill}
                                                    <button 
                                                        onClick={() => removeSkill(skill)}
                                                        className="text-gray-400 group-hover:text-red-500 transition-colors focus:outline-none ml-1"
                                                    >
                                                        <X size={14} strokeWidth={3} />
                                                    </button>
                                                </motion.span>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyDown={handleAddSkill}
                                            placeholder="Type a skill and press Enter to add..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-4 pr-12 focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all outline-none text-sm font-medium"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Plus size={20} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                        </motion.div>
                        )} {/* end !isLoading */}
      </div>
    </div>
  );
};

export default Profile;