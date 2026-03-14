import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Smile, CloudSun, Wind, AlertTriangle, Skull, AlertOctagon, Users, Activity, ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface AQICategory {
  range: string;
  label: string;
  icon: any;
  borderColor: string;
  bgColor: string;
  textColor: string;
  causes: string[];
  healthImpacts: string[];
  riskGroups?: string[];
  actions: string[];
}

export default function Health() {
  const aqiCategories: AQICategory[] = [
    {
      range: "0 - 50",
      label: "Good",
      icon: Smile,
      borderColor: "border-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      causes: [
        "Minimal vehicle emissions",
        "Low industrial activity",
        "Good weather conditions"
      ],
      healthImpacts: [
        "No health risks",
        "Air quality is ideal for outdoor activities"
      ],
      actions: [
        "Enjoy outdoor activities",
        "Perfect time for exercise and recreation",
        "Open windows for fresh air"
      ]
    },
    {
      range: "51 - 100",
      label: "Moderate",
      icon: CloudSun,
      borderColor: "border-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      causes: [
        "Moderate traffic",
        "Dust from construction sites",
        "Light industrial emissions"
      ],
      healthImpacts: [
        "Acceptable air quality",
        "Unusually sensitive people may feel minor discomfort"
      ],
      riskGroups: ["People with severe asthma"],
      actions: [
        "Most people can enjoy outdoor activities",
        "Sensitive individuals: consider reducing prolonged exertion",
        "Monitor symptoms if you're highly sensitive"
      ]
    },
    {
      range: "101 - 150",
      label: "Unhealthy for Sensitive Groups",
      icon: Wind,
      borderColor: "border-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      causes: [
        "Heavy traffic congestion",
        "Construction dust and emissions",
        "Burning crop residue nearby"
      ],
      healthImpacts: [
        "Breathing issues for sensitive groups",
        "Possible eye, nose, throat irritation",
        "Increased coughing and fatigue"
      ],
      riskGroups: [
        "Children and elderly",
        "People with asthma or lung disease",
        "Heart disease patients"
      ],
      actions: [
        "Sensitive groups: reduce outdoor activities",
        "Close windows when indoors",
        "Wear a mask (N95/KN95) if going outside",
        "Use air purifiers indoors"
      ]
    },
    {
      range: "151 - 200",
      label: "Unhealthy",
      icon: AlertTriangle,
      borderColor: "border-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      causes: [
        "Dense traffic and pollution",
        "Industrial emissions",
        "Weather conditions trapping pollutants"
      ],
      healthImpacts: [
        "Everyone may experience health effects",
        "Breathing difficulties and chest discomfort",
        "Worsening of existing respiratory conditions",
        "Headaches and fatigue"
      ],
      riskGroups: [
        "Everyone, especially sensitive groups",
        "Outdoor workers",
        "Pregnant women"
      ],
      actions: [
        "Everyone: limit outdoor activities",
        "Avoid heavy exertion outdoors",
        "Wear N95/KN95 masks outside",
        "Keep air purifiers running",
        "Monitor health symptoms closely"
      ]
    },
    {
      range: "201 - 300",
      label: "Severe",
      icon: ShieldAlert,
      borderColor: "border-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      causes: [
        "Severe pollution events",
        "Heavy industrial emissions",
        "Widespread burning or fires",
        "Stagnant weather trapping pollution"
      ],
      healthImpacts: [
        "Serious health effects for everyone",
        "Difficulty breathing, chest pain",
        "Severe respiratory and cardiovascular stress",
        "Reduced lung function"
      ],
      riskGroups: [
        "Everyone at risk",
        "Children, elderly at higher risk",
        "All pre-existing health conditions"
      ],
      actions: [
        "Stay indoors and keep doors/windows closed",
        "Avoid all outdoor activities",
        "Use high-quality air purifiers",
        "Wear N95/KN95 masks if you must go out",
        "Seek medical help if experiencing symptoms"
      ]
    },
    {
      range: "300+",
      label: "Hazardous",
      icon: Skull,
      borderColor: "border-rose-900",
      bgColor: "bg-rose-50",
      textColor: "text-rose-900",
      causes: [
        "Extreme pollution emergency",
        "Major industrial disasters",
        "Large-scale fires or explosions",
        "Severe weather inversions"
      ],
      healthImpacts: [
        "Emergency health conditions",
        "Severe breathing problems for everyone",
        "Critical risk of heart attacks and strokes",
        "Immediate threat to life"
      ],
      riskGroups: [
        "Entire population at severe risk",
        "Critical danger for all age groups",
        "Emergency for those with health conditions"
      ],
      actions: [
        "Stay indoors at all times",
        "Seal all doors and windows",
        "Run air purifiers continuously",
        "Avoid any physical activity",
        "Follow emergency protocols",
        "Seek immediate medical attention if needed"
      ]
    }
  ];

  const faqItems = [
    {
      q: "What is AQI and why does it matter?",
      a: "The Air Quality Index (AQI) measures how polluted the air is. Higher numbers mean more pollution and greater health risks. It helps you decide when it's safe to go outside."
    },
    {
      q: "What are PM2.5 and PM10?",
      a: "PM2.5 and PM10 are tiny particles in the air. PM2.5 is smaller and more dangerous as it can enter your lungs and bloodstream. Both cause breathing problems and health issues."
    },
    {
      q: "When should I wear a mask?",
      a: "Wear N95 or KN95 masks when AQI is above 100 if you're sensitive, or above 150 for everyone. Cloth masks don't filter out fine particles effectively."
    },
    {
      q: "Can I exercise outdoors?",
      a: "Exercise outdoors when AQI is 0-100. Limit exercise when AQI is 100-150, especially if you're sensitive. Avoid outdoor exercise completely when AQI exceeds 150."
    },
    {
      q: "How can I protect myself indoors?",
      a: "Use air purifiers with HEPA filters, keep windows closed during high pollution, avoid burning incense or candles, and maintain good ventilation when air quality improves."
    },
    {
      q: "What are the long-term effects of air pollution?",
      a: "Long-term exposure can lead to chronic respiratory diseases, heart problems, reduced lung function, and increased risk of cancer. Children and elderly are especially vulnerable."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-4">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-slate-100"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Health Guide</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Understand how air quality affects your health and learn what actions to take for each AQI level.
          </p>
        </div>

        {/* AQI Category Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold mb-6 text-center">AQI Categories & Health Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {aqiCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card 
                  key={index} 
                  className={`border-l-4 ${category.borderColor} ${category.bgColor} hover:shadow-lg transition-shadow duration-300`}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-full bg-white shadow-sm`}>
                        <Icon className={`w-6 h-6 ${category.textColor}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${category.textColor}`}>{category.label}</h3>
                        <p className={`text-xs font-semibold ${category.textColor} opacity-80`}>AQI: {category.range}</p>
                      </div>
                    </div>

                    {/* Possible Causes */}
                    <div className="mb-3">
                      <h4 className="font-bold text-gray-800 mb-1.5 flex items-center gap-1.5 text-sm">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Possible Causes
                      </h4>
                      <ul className="text-xs text-gray-700 space-y-0.5">
                        {category.causes.map((cause, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{cause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Health Impacts */}
                    <div className="mb-3">
                      <h4 className="font-bold text-gray-800 mb-1.5 flex items-center gap-1.5 text-sm">
                        <Activity className="w-3.5 h-3.5" />
                        Health Impacts
                      </h4>
                      <ul className="text-xs text-gray-700 space-y-0.5">
                        {category.healthImpacts.map((impact, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{impact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* High-Risk Groups */}
                    {category.riskGroups && (
                      <div className="mb-3">
                        <h4 className="font-bold text-gray-800 mb-1.5 flex items-center gap-1.5 text-sm">
                          <Users className="w-3.5 h-3.5" />
                          High-Risk Groups
                        </h4>
                        <ul className="text-xs text-gray-700 space-y-0.5">
                          {category.riskGroups.map((group, i) => (
                            <li key={i} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{group}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1.5 flex items-center gap-1.5 text-sm">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Recommended Actions
                      </h4>
                      <ul className="text-xs text-gray-700 space-y-0.5">
                        {category.actions.map((action, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">✓</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="p-6 rounded-xl shadow-md border-2 border-slate-100 bg-white mb-8">
          <h2 className="text-2xl font-display font-bold mb-4 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-semibold text-sm hover:text-emerald-600 py-3">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 leading-relaxed pb-3 text-xs">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </div>
  );
}
