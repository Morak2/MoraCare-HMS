import { Activity, Twitter, Linkedin, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#0A1A3F] text-slate-400">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">

                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4 group">
                            <div className="w-10 h-10 rounded-xl bg-[#1F2A44] flex items-center justify-center shadow-lg group-hover:scale-105 transition border border-[#1F2A44]">
                                <Activity size={22} className="text-[#FF5A1F]" />
                            </div>
                            <span className="text-xl font-black text-white tracking-tight">
                                Mora<span className="text-[#FF5A1F]">Care</span>
                            </span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed mb-6 max-w-sm">
                            The complete hospital management platform for healthcare facilities worldwide.
                            Manage patients, appointments, and medical records from one secure place.
                        </p>
                        <div className="flex gap-3">
                            {[
                                { Icon: Twitter, href: "https://twitter.com" },
                                { Icon: Linkedin, href: "https://linkedin.com" },
                                { Icon: Facebook, href: "https://facebook.com" }
                            ].map(({ Icon, href }, idx) => (
                                <a
                                    key={idx}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-[#1F2A44] hover:bg-[#FF5A1F] flex items-center justify-center transition text-white"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Product</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link to="/appointments" className="hover:text-[#FF5A1F] transition">
                                    Appointments
                                </Link>
                            </li>
                            <li>
                                <Link to="/registration" className="hover:text-[#FF5A1F] transition">
                                    Patient Registration
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard" className="hover:text-[#FF5A1F] transition">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5A1F] transition">
                                    Integrations
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5A1F] transition">
                                    Security
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Solutions Links */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Solutions</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a href="#" className="hover:text-[#FF5A1F] transition">
                                    General Hospitals
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5A1F] transition">
                                    Specialty Clinics
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5A1F] transition">
                                    Multi-Branch
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5A1F] transition">
                                    Medical Centers
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Company</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a href="#" className="hover:text-[#FF5A1F] transition">
                                    About
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5A1F] transition">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5A1F] transition">
                                    Careers
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#FF5A1F] transition">
                                    Contact
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Contact Info Bar */}
                <div className="mt-12 pt-8 border-t border-[#1F2A44]">
                    <div className="grid md:grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#1F2A44] flex items-center justify-center flex-shrink-0">
                                <Phone size={18} className="text-[#FF5A1F]" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs">Phone Number</p>
                                <p className="text-white font-semibold">080 2950 1995</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#1F2A44] flex items-center justify-center flex-shrink-0">
                                <Mail size={18} className="text-[#FF5A1F]" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs">Email Support</p>
                                <p className="text-white font-semibold">support@moracare.com</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#1F2A44] flex items-center justify-center flex-shrink-0">
                                <MapPin size={18} className="text-[#FF5A1F]" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs">Location</p>
                                <p className="text-white font-semibold">First floor, 2B Yinusa Adeniji Street, Off Toyin, Ikeja</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-[#1F2A44] bg-[#081431]">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                        <div className="flex flex-col items-center md:items-start gap-1">
                            <p className="text-[#FF5A1F] font-semibold text-xs tracking-wide">
                                Powered by: Anchorsoft Innovations Limited
                            </p>
                            <p>© {currentYear} MoraCare. All rights reserved.</p>
                        </div>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition">Privacy</a>
                            <a href="#" className="hover:text-white transition">Terms</a>
                            <a href="#" className="hover:text-white transition">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}