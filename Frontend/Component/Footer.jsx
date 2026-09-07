import React from "react";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Heart className="text-white" size={20} fill="currentColor" />
              </div>
              <span className="text-2xl font-bold text-white">MoraCare</span>
            </div>
            <p className="text-slate-400">
              Revolutionizing healthcare management with cutting-edge technology
              and compassionate care.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  Services
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  Doctors
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Connect</h4>
            <p className="text-slate-400 mb-4">
              Stay updated with the latest healthcare innovations
            </p>
            <div className="flex gap-3">
              {["Facebook", "Twitter", "LinkedIn", "Instagram"].map((social) => (
                <button
                  key={social}
                  className="w-10 h-10 bg-slate-800 rounded-lg hover:bg-emerald-600 transition-colors duration-300 flex items-center justify-center"
                >
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-white/20 rounded"></div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-slate-500">
          <p>&copy; 2026 MoraCare Hospital Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;