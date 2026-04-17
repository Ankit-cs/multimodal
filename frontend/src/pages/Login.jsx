import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Zap, Mail, Lock, ArrowRight, Github, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { login as apiLogin } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
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
    
    // Increased rotation angles for more dramatic tilt
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["25deg", "-25deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-25deg", "25deg"]);

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
            // Call the /auth/login endpoint and get back { access_token, user }
            const tokenData = await apiLogin(email, password);
            // Save to localStorage and redirect to /dashboard via AuthContext
            login(tokenData);
        } catch (err) {
            // Show the error message from the server (e.g. "Invalid email or password.")
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex min-h-screen bg-white font-sans">
            {/* Left Side - Brand & Deep 3D Visuals (Dark Mode) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0a0a0a] text-white p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
                
                <div className="relative z-10 flex items-center gap-2">
                    <div className="bg-white text-black p-1.5 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">NexusAl</span>
                </div>

                <div className="relative z-10 max-w-lg">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
                            Specialized Intelligence, <br />
                            <span className="text-gray-400">Working in Harmony.</span>
                        </h1>
                        <p className="text-lg text-gray-400 leading-relaxed mb-16">
                            Stop managing work—start coordinating it. Log in to your multi-agent workspace and watch complex tasks turn into automated execution.
                        </p>
                    </motion.div>

                    {/* Highly 3D Interactive Terminal */}
                    <div 
                        style={{ perspective: 1200 }} 
                        className="w-full flex justify-center py-12 cursor-crosshair relative"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        <motion.div 
                            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                            className="bg-[#151515]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-8 font-mono text-sm shadow-2xl shadow-black/80 w-full relative"
                        >
                            {/* Floating Status Badge (Extreme Z-Depth) */}
                            <div 
                                style={{ transform: "translateZ(140px)" }}
                                className="absolute -top-6 -right-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-xl shadow-emerald-500/10 backdrop-blur-md"
                            >
                                <Activity size={16} /> System Online
                            </div>

                            {/* Deep Inner Layers */}
                            <div style={{ transform: "translateZ(40px)" }} className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <span className="ml-2 text-xs text-gray-600 font-sans tracking-widest uppercase">Agent Console</span>
                            </div>
                            
                            <div className="space-y-4">
                                <p style={{ transform: "translateZ(60px)" }} className="text-emerald-400 flex items-center gap-2 drop-shadow-md">
                                    <ArrowRight size={14}/> Booting core services...
                                </p>
                                <p style={{ transform: "translateZ(80px)" }} className="text-blue-400 flex items-center gap-2 drop-shadow-md">
                                    <ArrowRight size={14}/> Planner agent connected via Service Bus.
                                </p>
                                <p style={{ transform: "translateZ(100px)" }} className="text-gray-300 flex items-center gap-2 font-bold text-base drop-shadow-xl">
                                    <span className="animate-pulse w-3 h-5 bg-gray-300 block"></span> Awaiting human command
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* <div className="relative z-10 text-sm text-gray-600 font-medium">
                    © 2026 NexusAl Inc.
                </div> */}
            </div>

            {/* Right Side - Form (Light Mode) */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
                <div className="self-start mb-8 flex items-center gap-2 lg:hidden">
                    <div className="bg-black text-white p-1.5 rounded-lg">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">NexusAl</span>
                </div>

                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
                        <p className="text-gray-500">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Inline error banner — only visible when something went wrong */}
                        {error && (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                                <AlertCircle size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}
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
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-700 block">Password</label>
                                <a href="#" className="text-sm font-semibold text-gray-500 hover:text-black transition-colors">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors bg-gray-50/50 focus:bg-white text-slate-900"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10 group mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                            ) : (
                                <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span></div>
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
                        Don't have an account? <Link to="/signup" className="text-black font-bold hover:underline">Sign up for free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;