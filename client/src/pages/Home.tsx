import { LocationSearch } from "@/components/LocationSearch";
import { Link } from "wouter";
import { Wind, Map, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-0">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/50 text-emerald-800 text-sm font-medium border border-emerald-200">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              Real-time Global Air Quality Data
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-display font-bold text-foreground tracking-tight mb-5">
              Breathe <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Cleaner</span>,<br /> 
              Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">Better</span>.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl text-muted-foreground mb-6 max-w-2xl leading-relaxed">
              Track hyperlocal air quality indexes, pollutants, and weather forecasts for any neighborhood worldwide. 
              Get street-level precision for your exact location.
            </motion.p>
            
            <motion.div variants={itemVariants} className="w-full flex justify-center mb-8">
              <LocationSearch />
            </motion.div>

            {/* Features Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {[
                { 
                  icon: Activity, 
                  title: "Real-time Monitoring", 
                  desc: "Get instant AQI updates from thousands of stations worldwide."
                },
                { 
                  icon: Map, 
                  title: "Trip Planner", 
                  desc: "Compare air quality between destinations to travel safely."
                },
                { 
                  icon: ShieldCheck, 
                  title: "Health Advice", 
                  desc: "Actionable recommendations to protect your health based on pollution levels."
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="bg-blue-50/60 backdrop-blur-sm p-5 rounded-3xl shadow-lg border-2 border-blue-600/40"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-700">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-display mb-2 text-slate-900">{feature.title}</h3>
                  <p className="text-slate-700 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-200/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Start Monitoring Today</h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">Create an account to save your favorite locations and track historical air quality data.</p>
          <Link href="/login">
            <button className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/50">
              Get Started for Free
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
