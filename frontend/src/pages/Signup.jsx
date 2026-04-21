import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Zap, Mail, Lock, ArrowRight, Github, User, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { signup as apiSignup, login as apiLogin } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    // --- Enhanced 3D Tilt Effect State ---
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });
    
    // Increased rotation angles
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["30deg", "-30deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-30deg", "30deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // 1. Create the account
            await apiSignup(name, email, password);
            // 2. Immediately log in so the user lands on /dashboard without a second step
            const tokenData = await apiLogin(email, password);
            login(tokenData);
        } catch (err) {
            // Surface the server's error message (e.g. "An account with that email already exists.")
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex min-h-screen bg-white font-sans">
            {/* Left Side - Form (Light Mode) */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative order-2 lg:order-1">
                <div className="self-start mb-8 flex items-center gap-2 lg:hidden">
                    <div className="bg-black text-white p-1.5 rounded-lg">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">NexusAl</span>
                </div>

                <div className="w-full max-w-md space-y-8 mt-12 lg:mt-0">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create an account</h2>
                        <p className="text-gray-500">Empower your agent team to handle complex tasks for you.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Inline error banner — only visible when the server returns an error */}
                        {error && (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                                <AlertCircle size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-gray-50/50 focus:bg-white text-slate-900"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-gray-50/50 focus:bg-white text-slate-900"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-gray-50/50 focus:bg-white text-slate-900"
                                    placeholder="Create a strong password"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2 font-medium">Must be at least 8 characters long.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10 group mt-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                            ) : (
                                <>Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500 font-medium">Or sign up with</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-slate-700">
                            <Github size={20} /> GitHub
                        </button>
                        <button className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-slate-700">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" fill="#00a4ef"/></svg>
                            Microsoft
                        </button>
                    </div>

                    <p className="text-center text-sm text-gray-500 font-medium mt-8">
                        Already have an account? <Link to="/login" className="text-black font-bold hover:underline">Log in</Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Brand & Deep 3D Visuals (Dark Mode) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0a0a0a] text-white p-12 flex-col justify-between relative overflow-hidden order-1 lg:order-2">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
                
                <div className="relative z-10 flex justify-end">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold tracking-tight">NexusAl</span>
                        <div className="bg-white text-black p-1.5 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            <Zap size={24} fill="currentColor" />
                        </div>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg ml-auto text-right">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
                            "Automation shouldn't mean losing control."
                        </h1>
                        <p className="text-lg text-gray-400 leading-relaxed mb-16">
                       Join thousands of teams using Human-in-the-Loop (HITL)—combining AI speed with human judgment for reliable, error-free outcomes.
                        </p>
                    </motion.div>

                    {/* Highly 3D Overlapping Cards */}
                    <div 
                        style={{ perspective: 1200 }} 
                        className="flex justify-end py-12 cursor-crosshair relative"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        <motion.div 
                            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                            className="relative w-80 h-48"
                        >
                            {/* Back Card (Slower Layer) */}
                            <div 
                                style={{ transform: "translateZ(30px)", right: "2rem", top: "0" }} 
                                className="absolute bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-3xl w-56 shadow-2xl shadow-black"
                            >
                                <h4 className="text-emerald-400 font-bold text-4xl mb-2 flex items-center gap-2">
                                    4x <Zap size={24} className="fill-emerald-400" />
                                </h4>
                                <p className="text-sm text-gray-400 font-medium">Faster Execution</p>
                            </div>
                            
                            {/* Front Card (Faster Layer) */}
                            <div 
                                style={{ transform: "translateZ(100px)", right: "8rem", top: "4rem" }} 
                                className="absolute bg-[#151515]/95 backdrop-blur-xl border border-gray-700 p-6 rounded-3xl w-56 shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
                            >
                                <h4 className="text-blue-400 font-bold text-4xl mb-2 flex items-center gap-2 drop-shadow-lg">
                                    99% <Lock size={24} className="text-blue-400" />
                                </h4>
                                <p className="text-sm text-gray-300 font-medium">Task Accuracy</p>
                            </div>

                            {/* Floating Shield Icon (Extreme Z-Depth) */}
                            <div 
                                style={{ transform: "translateZ(180px)", right: "5rem", top: "1rem" }}
                                className="absolute bg-emerald-500 text-white p-3 rounded-xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] border border-emerald-400"
                            >
                                <ShieldCheck size={28} />
                            </div>
                        </motion.div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Signup;