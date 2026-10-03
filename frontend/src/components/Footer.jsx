import React from 'react';
import { Scale, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary-950 pt-10 pb-5 text-blue-100 border-t border-primary-900 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-6">
          
          <div className="md:col-span-1 space-y-4">
             <div className="flex items-center space-x-3">
                <div className="bg-primary-600 text-white p-2 rounded-lg font-bold shadow-md">
                  <Scale size={20} />
                </div>
                <span className="text-xl font-black text-white tracking-tight">
                  DIGI LAW <span className="text-blue-400">REPORTER</span>
                </span>
             </div>
             <p className="text-blue-200/80 text-xs leading-relaxed">
               India's leading verified legal research repository. Delivering sub-second judgment searches, citations, and headnotes.
             </p>
             <div className="flex items-center space-x-2 text-xs text-blue-300 font-semibold">
                <ShieldCheck size={16} /> <span>SSL Encrypted & Verified</span>
             </div>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm text-white uppercase tracking-wider border-b border-primary-800 pb-2">Quick Navigation</h4>
            <ul className="space-y-2.5 text-xs text-blue-200/80">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/child-safety" className="hover:text-white transition-colors">Child Safety</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm text-white uppercase tracking-wider border-b border-primary-800 pb-2">Jurisdiction</h4>
            <ul className="space-y-2.5 text-xs text-blue-200/80">
              <li>Supreme Court of India</li>
              <li>Delhi High Court</li>
              <li>Bombay High Court</li>
              <li>Appellate Tribunals</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm text-white uppercase tracking-wider border-b border-primary-800 pb-2">Contact Us</h4>
            <ul className="space-y-3 text-xs text-blue-200/80">
              <li className="flex items-start gap-2.5">
                <Mail size={15} className="text-blue-400 mt-0.5 shrink-0" />
                <span>support@digilawreporter.in</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={15} className="text-blue-400 mt-0.5 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="text-blue-400 mt-0.5 shrink-0" />
                <span>Legal Complex, High Court Road, New Delhi, India</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="text-center pt-4 border-t border-primary-900/80 text-xs text-blue-300/60">
          © {new Date().getFullYear()} Digital Law Reporter. All rights reserved.
        </div>
      </div>
    </footer>
  );
}


