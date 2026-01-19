import {
  MapPinIcon,
  SparklesIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

export default function Services() {
  const services = [
    {
      icon: MapPinIcon,
      title: "Online Presence & Google Maps",
      description:
        "Optimize your Google Business Profile to improve local visibility and attract more customers. We help you manage reviews, update business information, and enhance your local SEO.",
      features: [
        "Google Business Profile optimization",
        "Review management and response strategies",
        "Local SEO improvements",
        "Business information accuracy",
      ],
    },
    {
      icon: SparklesIcon,
      title: "AI-Powered Automations",
      description:
        "Implement intelligent automation solutions that handle customer service, sales processes, and repetitive tasks. Save time and resources while improving customer experience.",
      features: [
        "Customer service chatbots",
        "Sales automation workflows",
        "Lead qualification systems",
        "Automated follow-up sequences",
      ],
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Customer Service Automation",
      description:
        "Deploy AI chatbots and automated systems that provide 24/7 customer support, answer common questions, and escalate complex issues to your team.",
      features: [
        "AI chatbot implementation",
        "Multi-channel support (website, social media)",
        "Automated ticket routing",
        "Customer satisfaction tracking",
      ],
    },
    {
      icon: ShoppingCartIcon,
      title: "Sales Automation",
      description:
        "Streamline your sales process with automated lead nurturing, qualification, and follow-up systems that help you close more deals.",
      features: [
        "Lead scoring and qualification",
        "Automated email sequences",
        "CRM integration and optimization",
        "Sales pipeline automation",
      ],
    },
    {
      icon: CpuChipIcon,
      title: "Tech Organization & Infrastructure",
      description:
        "Organize and optimize your technology stack. We help you streamline workflows, consolidate tools, and create efficient digital processes.",
      features: [
        "Tech stack audit and optimization",
        "Workflow automation",
        "Tool consolidation strategies",
        "Digital infrastructure organization",
      ],
    },
    {
      icon: WrenchScrewdriverIcon,
      title: "Custom Business Solutions",
      description:
        "Tailored technology solutions designed specifically for your business needs. From custom integrations to specialized automations.",
      features: [
        "Custom software integrations",
        "Business process automation",
        "Data management solutions",
        "Scalable tech architecture",
      ],
    },
  ];

  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-900 tracking-tight mb-4">
            Our Services
          </h1>
          <p className="text-lg text-zinc-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive tech solutions to help your business grow and operate more efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="p-8 rounded-2xl bg-white border border-zinc-200/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start space-x-5 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-zinc-700" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">
                      {service.title}
                    </h3>
                    <p className="text-zinc-600 mb-6 leading-relaxed">
                      {service.description}
                    </p>
                    <ul className="space-y-3">
                      {service.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start text-sm text-zinc-600"
                        >
                          <span className="text-zinc-900 mr-3 font-medium">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
