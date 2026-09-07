import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? "bg-white/95 backdrop-blur-xl shadow-lg py-4"
                    : "bg-slate-900/30 backdrop-blur-md py-6"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Heart className="text-white" size={20} fill="currentColor" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        MoraCare
                    </span>
                </Link>
                <div className="hidden md:flex items-center gap-8">
                    <a
                        href="#services"
                        className={`font-medium transition ${scrolled
                                ? "text-slate-700 hover:text-emerald-600"
                                : "text-white hover:text-emerald-400"
                            }`}
                    >
                        Services
                    </a>
                    <a
                        href="#features"
                        className={`font-medium transition ${scrolled
                                ? "text-slate-700 hover:text-emerald-600"
                                : "text-white hover:text-emerald-400"
                            }`}
                    >
                        Features
                    </a>
                    <a
                        href="#testimonials"
                        className={`font-medium transition ${scrolled
                                ? "text-slate-700 hover:text-emerald-600"
                                : "text-white hover:text-emerald-400"
                            }`}
                    >
                        Testimonials
                    </a>
                    <Link
                        to="/login"
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;