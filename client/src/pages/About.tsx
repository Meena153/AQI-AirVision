import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Info, AlertCircle, Wind, Activity, MapPin, Target, Globe, Zap, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const pollutants = [
  {
    name: "PM2.5",
    fullName: "Fine Particulate Matter",
    description: "Tiny particles in the air that are 2.5 micrometers or less in width. They can travel deep into the respiratory tract, reaching the lungs.",
    sources: "Vehicle exhaust, burning of fuels, power plants, wildfires.",
    impact: "Can cause heart and lung disease, aggravate asthma, and increase respiratory symptoms.",
    color: "bg-rose-500"
  },
  {
    name: "PM10",
    fullName: "Coarse Particulate Matter",
    description: "Inhalable particles with diameters that are generally 10 micrometers and smaller. These are larger than PM2.5 but still dangerous.",
    sources: "Dust from roads, construction sites, landfills, and agriculture.",
    impact: "Can irritate eyes, nose, and throat. Long term exposure can affect lung function.",
    color: "bg-orange-500"
  },
  {
    name: "O3",
    fullName: "Ground-level Ozone",
    description: "Not emitted directly into the air, but created by chemical reactions between oxides of nitrogen (NOx) and volatile organic compounds (VOC).",
    sources: "Industrial facilities, electric utilities, motor vehicle exhaust.",
    impact: "Can trigger variety of health problems, particularly for children, the elderly, and people of all ages who have lung diseases such as asthma.",
    color: "bg-amber-500"
  },
  {
    name: "NO2",
    fullName: "Nitrogen Dioxide",
    description: "A group of highly reactive gases known as oxides of nitrogen. It forms quickly from emissions from cars, trucks and buses, power plants, and off-road equipment.",
    sources: "Burning of fuel (emissions from cars, trucks and buses, power plants).",
    impact: "Can irritate airways in the human respiratory system. Such exposures over short periods can aggravate respiratory diseases.",
    color: "bg-blue-500"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 py-4 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-slate-100"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <motion.h1 variants={itemVariants} className="text-3xl md:text-4xl font-display font-bold text-slate-900">
              Understanding Air Quality
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Air pollution consists of various chemicals and particles that can be harmful to our health and the environment.
            </motion.p>
          </div>

          {/* Hyperlocal AQI Feature Highlight */}
          <motion.div variants={itemVariants} className="relative">
            <div className="rounded-2xl p-6 md:p-8 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)', boxShadow: '0 20px 60px rgba(13, 148, 136, 0.4)' }}>
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/20 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: Math.random() * 3 + 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <MapPin className="w-12 h-12 text-emerald-200" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-bold">Hyperlocal AQI Monitoring</h2>
                </div>

                <p className="text-emerald-50 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
                  Unlike traditional monitoring that shows city-wide averages, our platform provides <strong>hyperlocal air quality data</strong> — pinpointing AQI levels in specific neighborhoods, streets, and even your exact location within a 50km radius.
                </p>

                <div className="grid md:grid-cols-3 gap-4 pt-3">
                  <motion.div 
                    className="backdrop-blur-sm rounded-xl p-4 border border-emerald-300/30 shadow-lg shadow-teal-500/20"
                    style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.25), rgba(20, 184, 166, 0.25))' }}
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: '0 20px 40px rgba(13, 148, 136, 0.4), 0 0 30px rgba(13, 148, 136, 0.3)',
                      borderColor: "rgba(110,231,183,0.6)" 
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Target className="w-8 h-8 text-emerald-100 mb-2" />
                    <h3 className="font-bold text-base mb-1.5">Precise Location</h3>
                    <p className="text-emerald-50 text-xs">
                      Get AQI readings for your exact coordinates, not just your city. Perfect for finding clean air pockets nearby.
                    </p>
                  </motion.div>

                  <motion.div 
                    className="backdrop-blur-sm rounded-xl p-4 border border-teal-300/30 shadow-lg shadow-teal-500/20"
                    style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.25), rgba(20, 184, 166, 0.25))' }}
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: '0 20px 40px rgba(13, 148, 136, 0.4), 0 0 30px rgba(13, 148, 136, 0.3)',
                      borderColor: "rgba(94,234,212,0.6)" 
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Globe className="w-8 h-8 text-teal-100 mb-2" />
                    <h3 className="font-bold text-base mb-1.5">50km Coverage</h3>
                    <p className="text-teal-50 text-xs">
                      Discover cleaner areas within 50km. Plan trips, outdoor activities, or find healthier routes with confidence.
                    </p>
                  </motion.div>

                  <motion.div 
                    className="backdrop-blur-sm rounded-xl p-4 border border-cyan-300/30 shadow-lg shadow-teal-500/20"
                    style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.25), rgba(20, 184, 166, 0.25))' }}
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: '0 20px 40px rgba(13, 148, 136, 0.4), 0 0 30px rgba(13, 148, 136, 0.3)',
                      borderColor: "rgba(103,232,249,0.6)" 
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Zap className="w-8 h-8 text-cyan-100 mb-2" />
                    <h3 className="font-bold text-base mb-1.5">Real-Time Updates</h3>
                    <p className="text-cyan-50 text-xs">
                      Live data from government stations (WAQI/aqicn.org) ensures you always have the most accurate information.
                    </p>
                  </motion.div>
                </div>

                <div className="backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 mt-4 shadow-lg shadow-teal-500/10" style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.15), rgba(20, 184, 166, 0.15))' }}>
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Why Hyperlocal Matters
                  </h3>
                  <ul className="space-y-1.5 text-white text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-200 mt-1">•</span>
                      <span><strong>Air quality varies drastically</strong> even within a few kilometers due to traffic, industrial zones, and green spaces.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-200 mt-1">•</span>
                      <span><strong>City-wide averages hide hotspots</strong> — your neighborhood might have worse (or better) air than reported.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-200 mt-1">•</span>
                      <span><strong>Make informed decisions</strong> about where to exercise, take kids to play, or even where to live.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-200 mt-1">•</span>
                      <span><strong>Find clean air refuges</strong> near you — parks, lakesides, or residential areas with better air quality.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 text-center">
                  <a href="/map" className="inline-flex items-center justify-center px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    Explore Hyperlocal AQI Map
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Visual Animation Section */}
          <motion.div variants={itemVariants} className="relative h-80 bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center border border-slate-800">
            <div className="absolute inset-0">
              {/* Animated Gradients */}
              <motion.div 
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.15),transparent_70%)]"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.05),transparent,rgba(244,63,94,0.05))]" />
              
              {/* Multi-colored Particles with Enhanced Animation */}
              {[...Array(50)].map((_, i) => {
                const colors = [
                  "bg-rose-400", "bg-emerald-400", "bg-sky-400", 
                  "bg-amber-400", "bg-purple-400", "bg-indigo-400", "bg-pink-400"
                ];
                const color = colors[i % colors.length];
                const size = Math.random() * 14 + 3;
                
                return (
                  <motion.div
                    key={i}
                    className={`absolute rounded-full blur-[1px] ${color}`}
                    style={{
                      width: size,
                      height: size,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      x: [0, (Math.random() - 0.5) * 250],
                      y: [0, (Math.random() - 0.5) * 250],
                      scale: [1, 1.8, 1],
                      opacity: [0.1, 0.7, 0.1],
                    }}
                    transition={{
                      duration: Math.random() * 10 + 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: Math.random() * 2,
                    }}
                  />
                );
              })}
            </div>
            
            <div className="relative text-center text-white space-y-4 px-6 z-10 backdrop-blur-[2px] py-8 rounded-2xl border border-white/5 bg-black/20">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
                className="inline-block"
              >
                <Activity className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
              </motion.div>
              <motion.h2 
                className="text-3xl font-display font-bold tracking-tight"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                Microscopic Particle Flow
              </motion.h2>
              <p className="text-slate-300 max-w-md mx-auto text-lg leading-relaxed">
                Experience a simulation of different sized pollutants and their movement patterns in the atmosphere.
              </p>
            </div>
          </motion.div>

          {/* Pollutants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pollutants.map((pollutant) => (
              <motion.div key={pollutant.name} variants={itemVariants}>
                <Card 
                  className="p-4 h-full border-none rounded-xl overflow-hidden relative group transition-all duration-300"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.1)'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(13, 148, 136, 0.25), 0 0 20px rgba(13, 148, 136, 0.15)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.1)';
                  }}
                >
                  {/* Background Animated Particles */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`absolute rounded-full blur-[2px] ${pollutant.color}`}
                        style={{
                          width: Math.random() * 15 + 5,
                          height: Math.random() * 15 + 5,
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          x: [0, (Math.random() - 0.5) * 60],
                          y: [0, (Math.random() - 0.5) * 60],
                          scale: [1, 1.3, 1],
                          opacity: [0.1, 0.4, 0.1],
                        }}
                        transition={{
                          duration: Math.random() * 4 + 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>

                  <div className={`absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full opacity-10 ${pollutant.color} group-hover:scale-150 transition-transform duration-700`} />
                  <div className="relative space-y-3 z-10">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${pollutant.color}`}>
                        {pollutant.name}
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{pollutant.fullName}</h3>
                        <p className="text-[10px] text-muted-foreground">Major Pollutant</p>
                      </div>
                    </div>
                    
                    <p className="text-xs leading-relaxed text-slate-600">
                      {pollutant.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          <Wind className="w-3 h-3" /> Sources
                        </div>
                        <p className="text-[10px] text-slate-500">{pollutant.sources}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" /> Impact
                        </div>
                        <p className="text-[10px] text-slate-500">{pollutant.impact}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Health Guide CTA */}
          <motion.div 
            variants={itemVariants} 
            className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 text-white text-center space-y-4 shadow-xl shadow-emerald-900/20 relative overflow-hidden"
          >
            {/* Animated background elements */}
            <div className="absolute inset-0">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-white/10 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: Math.random() * 4 + 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Info className="w-10 h-10 mx-auto" />
            </motion.div>
            <h2 className="text-xl md:text-2xl font-display font-bold relative z-10">Protect Your Health</h2>
            <p className="text-emerald-100 max-w-2xl mx-auto text-base relative z-10">
              Knowing what's in the air is the first step. Use our Health Guide to understand what precautions you should take based on today's levels.
            </p>
            <div className="pt-3 relative z-10">
              <motion.a 
                href="/health" 
                className="inline-flex items-center justify-center px-6 py-2.5 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Health Guide
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
