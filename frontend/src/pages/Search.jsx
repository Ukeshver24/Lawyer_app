import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, FileText, Users, ArrowLeft } from 'lucide-react';

export default function SearchDashboard() {
  const navigate = useNavigate();
  
  const TILES = [
    { id: 1, title: 'Keyword Search', icon: Search, color: 'from-blue-600 to-blue-800', path: '/search/keyword?tab=keyword' },
    { id: 2, title: 'Find Content by Section', icon: BookOpen, color: 'from-blue-500 to-blue-700', path: '/search/keyword?tab=section' },
    { id: 3, title: 'Find by Citation', icon: FileText, color: 'from-blue-600 to-blue-800', path: '/search/keyword?tab=citation' },
    { id: 4, title: 'Find by Party Name', icon: Users, color: 'from-blue-700 to-blue-900', path: '/search/keyword?tab=party' },
  ];

  const handleTileClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 px-4 md:px-6 w-full font-jakarta bg-slate-50">
      
      {/* Exact User Uploaded Legal Search Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-100 pointer-events-none"
        style={{ backgroundImage: "url('/legal_search_bg.png')" }}
      ></div>

      {/* Top Left Back to Home Button (Directly below logo & name) */}
      <div className="absolute top-4 left-4 sm:left-6 lg:left-8 z-20">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/90 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-700 font-bold text-xs transition-all shadow-xs hover:shadow-md cursor-pointer backdrop-blur-xs"
          title="Return to Home"
        >
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col items-center my-auto">

        {/* Dashboard Header */}
        <div className="text-center mb-6 md:mb-8 w-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-1.5 tracking-tight font-cinzel">
            Legal Research Dashboard
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Select a search method to begin your research
          </p>
        </div>

        {/* Single Row 4-Card Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 w-full max-w-5xl mx-auto mt-2 sm:mt-4">
          {TILES.map((tile, index) => (
            <motion.div
              key={tile.id}
              onClick={() => handleTileClick(tile.path)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`
                relative overflow-hidden cursor-pointer group
                rounded-2xl shadow-md hover:shadow-xl
                bg-gradient-to-br ${tile.color}
                flex flex-col items-center justify-center p-4 sm:p-5 text-center
                min-h-[130px] sm:min-h-[145px] md:min-h-[155px]
                border border-white/20 transition-all duration-300
              `}
              whileTap={{ scale: 0.98 }}
            >
              {/* Subtle glow effect on hover */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
              
              {/* Compact Icon Badge */}
              <div className="bg-white/20 p-2.5 sm:p-3 rounded-full mb-2.5 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <tile.icon size={21} className="text-white" strokeWidth={2.2} />
              </div>
              
              {/* Title */}
              <h3 className="text-white font-extrabold text-xs sm:text-sm leading-snug drop-shadow-xs px-1">
                {tile.title}
              </h3>
            </motion.div>
          ))}
        </div>
        
      </div>

    </div>
  );
}
