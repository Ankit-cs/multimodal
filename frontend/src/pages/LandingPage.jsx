import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    ShieldCheck, Activity, CheckCircle2, XCircle,
    ShieldAlert, Zap, ArrowRight, Calendar as CalendarIcon, Mail
} from 'lucide-react';

// --- Reusable 3D Tilt Wrapper ---
const TiltCard = ({ children }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        x.set(mouseX / width - 0.5);
        y.set(mouseY / height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div 
            style={{ perspective: 1200 }} 
            className="w-full flex justify-center items-center py-10 cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div 
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className="w-full relative"
            >
                {children}
            </motion.div>
        </div>
    );
};

export default function LandingPage() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const now = new Date();

   const monthYear = now.toLocaleString('default', {
     month: 'long',
     year: 'numeric',
    });

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 overflow-x-hidden selection:bg-black selection:text-white">
            
            {/* Top Glow Effect */}
            <div className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.04)_0%,transparent_60%)] blur-[60px]" />
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-16 py-4 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-200' : 'bg-transparent'}`}>
                <div className="flex items-center gap-2 cursor-pointer">
                    <div className="bg-black text-white p-1.5 rounded-lg">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">NexusAl</span>
                </div>
                <div className="hidden md:flex gap-8">
                    {['Platform', 'Agents', 'Security', 'Pricing'].map(link => (
                        <span key={link} className="text-sm font-semibold text-gray-500 hover:text-black cursor-pointer transition-colors">{link}</span>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/login')} className="hidden md:block text-sm font-bold text-slate-700 hover:text-black transition-colors">Log in</button>
                    <button onClick={() => navigate('/signup')} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 transition-all hover:scale-105">Get Started</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 flex flex-col items-center text-center pt-48 pb-32 px-6 max-w-5xl mx-auto">
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-8">
                    Build without <br className="hidden md:block"/> limitations.
                </motion.h1>
                
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed mb-10">
                    NexusAl is a multi-agent platform for professionals—turning complex workflows into coordinated execution with autonomous, specialized agents.
                </motion.p>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => navigate('/signup')} className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:bg-gray-800 transition-all hover:scale-105 group">
                        Explore Platform <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    {/* <button className="bg-white text-black border border-gray-200 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-colors shadow-sm">
                        Read Whitepaper
                    </button> */}
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: "Dynamic Orchestration", desc: "Our proprietary protocol routes tasks to specialized agents in real-time based on mission objectives." },
                        { title: "Real-time Intelligence", desc: "Deeply integrated with Serper and Groq for sub-second facts and lightning-fast inference." },
                        { title: "Private Doc Indexing", desc: "Enterprise-grade RAG with vector search on Document  DB for secure retrieval." }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-3xl p-10 hover:border-black transition-colors hover:shadow-xl hover:shadow-black/5 group cursor-default">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl mb-6 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Split Feature: Governance (3D) */}
            <section className="max-w-7xl mx-auto px-6 py-32 flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 space-y-6">
                    <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">Control & Visibility</div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Human-led,<br/>Agent-executed.</h2>
                    <p className="text-lg text-gray-500 leading-relaxed max-w-md">
                        Built on transparency—so you can review agent decisions, verify tool usage, and approve critical steps while agents do the heavy work.
                    </p>
                </div>
                <div className="flex-1 w-full relative">
                    <TiltCard>
                        {/* The Base Card */}
                        <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 tracking-wider">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> COORDINATE ONLINE
                                </div>
                                <Activity size={16} className="text-gray-400" />
                            </div>

                            {/* Popping 3D Element: Agent Thought */}
                            <div style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-4 shadow-lg shadow-black/5">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Agent Reasoning</div>
                                <p className="text-sm font-medium text-slate-700 italic">
                                    "I have prepared the kickoff email—requesting approval before sending to make sure the tone is right."
                                </p>
                            </div>

                            {/* Popping 3D Element: Alert Badge */}
                            <div style={{ transform: "translateZ(60px)" }} className="bg-black text-white rounded-2xl p-4 flex items-center gap-3 shadow-2xl shadow-black/20 mb-6">
                                <ShieldCheck size={20} className="text-emerald-400" />
                                <span className="text-sm font-bold">APPROVAL: MAIL SERVICE staged.</span>
                            </div>

                            {/* Popping 3D Element: Buttons */}
                            <div style={{ transform: "translateZ(30px)" }} className="flex gap-3">
                                <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 py-3 rounded-xl text-sm font-bold text-gray-500 shadow-sm">
                                    <XCircle size={16} /> Decline
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl text-sm font-bold shadow-md">
                                    <CheckCircle2 size={16} /> Authorize
                                </button>
                            </div>
                        </div>
                    </TiltCard>
                </div>
            </section>

            {/* Split Feature: Mailing (3D) */}
            <section className="max-w-7xl mx-auto px-6 py-32 flex flex-col md:flex-row-reverse items-center gap-16 border-t border-gray-200">
                <div className="flex-1 space-y-6">
                    <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">Omnichannel Outreach</div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Professional Mailing,<br/>Automated.</h2>
                    <p className="text-lg text-gray-500 leading-relaxed max-w-md">
                        Craft, refine, and deliver transactional emails with NexusAl. Our agents ensure the right tone, structure, and timing—so you can focus on meaningful connections.
                    </p>
                </div>
                <div className="flex-1 w-full">
                    <TiltCard>
                        <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl p-8 relative">
                            {/* Window Header */}
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-6 mb-6">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-amber-400" />
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                <span className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-widest">New Message</span>
                            </div>

                            <div className="space-y-4 text-sm mb-8" style={{ transformStyle: "preserve-3d" }}>
                                <div className="flex gap-4 border-b border-gray-100 pb-4">
                                    <span className="font-bold text-gray-400 w-8">TO</span>
                                    <span className="font-semibold text-slate-800">team@nexusal.dev</span>
                                </div>
                                <div className="flex gap-4 border-b border-gray-100 pb-4">
                                    <span className="font-bold text-gray-400 w-8">SUB</span>
                                    <span className="font-semibold text-slate-800">Project Update & Next Steps</span>
                                </div>
                                <div className="pt-2 text-gray-600 leading-relaxed">
                                    Hi team,<br/><br/>I have completed the initial market research and attached a summary breakdown for your review. Let me know if you’d like any deeper insights
                                </div>
                            </div>

                            {/* Popping Prompt Badge */}
                            <div style={{ transform: "translateZ(80px)" }} className="absolute -bottom-6 -right-6 bg-black text-white px-6 py-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center gap-3">
                                <Mail size={20} className="text-emerald-400" />
                                <span className="text-sm font-bold font-mono">"Draft mail to team..."</span>
                            </div>
                        </div>
                    </TiltCard>
                </div>
            </section>

            {/* Split Feature: Calendar (3D) */}
            <section className="max-w-7xl mx-auto px-6 py-32 flex flex-col md:flex-row items-center gap-16 border-t border-gray-200">
                <div className="flex-1 space-y-6">
                    <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">Autonomous Scheduling</div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Calendar Management,<br/>Perfected.</h2>
                    <p className="text-lg text-gray-500 leading-relaxed max-w-md">
                        NexusAI agents interpret natural language to manage your schedule. From “Book dinner on Friday” to “Schedule a meeting on the 4th,” they coordinate availability, send invites, and resolve conflicts automatically.
                    </p>
                </div>
                <div className="flex-1 w-full">
                    <TiltCard>
                        <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl p-8 relative">
                            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                                <h3 className="text-xl font-bold">{monthYear}</h3>
                                <div className="flex gap-2">
                                    <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">&lsaquo;</button>
                                    <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">&rsaquo;</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-3 text-center mb-4">
                                {['M','T','W','Th','F','S','Su'].map(d => <div key={d} className="text-xs font-bold text-gray-400">{d}</div>)}
                                {Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }).map((_, i) => (
                                    <div key={i} className={`aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-colors ${i+1 === now.getDate() ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
                                        {i + 1}
                                    </div>
                                ))}
                            </div>

                            {/* Popping Prompt Badge */}
                            <div style={{ transform: "translateZ(80px)" }} className="absolute top-[40%] -right-12 bg-white border border-gray-200 p-4 rounded-2xl shadow-2xl w-64">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">User Prompt</div>
                                <div className="text-sm font-bold text-slate-800 font-mono">"Schedule kickoff meeting on the 14th"</div>
                            </div>
                        </div>
                    </TiltCard>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="max-w-6xl mx-auto px-6 py-24 mb-24">
                <div className="bg-black text-white rounded-[3rem] p-16 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
                    
                    <div className="relative z-10">
                        <h2 className="text-5xl font-black mb-6">The future is multi-agent.</h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">Join the companies building the next generation of autonomous enterprise workflows on NexusAl.</p>
                        <button onClick={() => navigate('/signup')} className="bg-white text-black px-10 py-5 rounded-2xl text-lg font-bold shadow-xl hover:bg-gray-100 hover:scale-105 transition-all">
                            Get Started Now
                        </button>
                    </div>
                </div>
            </section>

            {/* Minimalist Footer */}
            <footer className="border-t border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-black text-white p-1 rounded-lg">
                                <Zap size={16} fill="currentColor" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">NexusAl.</span>
                        </div>
                        <p className="text-sm text-gray-500">© 2026 NexusAl Platforms Inc.</p>
                    </div>
                    <div className="flex gap-16">
                        <div className="flex flex-col gap-3">
                            <span className="text-sm font-bold">Company</span>
                            {['About', 'Blog', 'Careers'].map(l => <a key={l} href="#" className="text-sm text-gray-500 hover:text-black">{l}</a>)}
                        </div>
                        <div className="flex flex-col gap-3">
                            <span className="text-sm font-bold">Resources</span>
                            {['Documentation', 'API Reference', 'Support'].map(l => <a key={l} href="#" className="text-sm text-gray-500 hover:text-black">{l}</a>)}
                        </div>
                        <div className="flex flex-col gap-3">
                            <span className="text-sm font-bold">Legal</span>
                            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => <a key={l} href="#" className="text-sm text-gray-500 hover:text-black">{l}</a>)}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}