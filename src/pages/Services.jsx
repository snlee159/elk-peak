import { Link } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  WrenchIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  AcademicCapIcon,
  PuzzlePieceIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

export default function Services() {
  const ladder = [
    {
      icon: MagnifyingGlassIcon,
      step: "Step 1",
      title: "AI Readiness Audit",
      pricing: "Fixed price",
      description:
        "Before anyone talks tools, we figure out where your business is actually leaking. We map how calls, leads, quotes, and paperwork move through your shop today, put a dollar figure on what the gaps cost you, and rank your automation opportunities by ROI.",
      features: [
        "A walkthrough of how work flows through your office, from first call to final invoice",
        "A dollar estimate of what missed calls and slow follow-ups cost you today",
        "Your top automation opportunities, ranked by return on investment",
        "A written plan that's yours to keep, whether or not you hire us for the build",
      ],
    },
    {
      icon: WrenchIcon,
      step: "Step 2",
      title: "Pilot Build",
      pricing: "Fixed fee · one workflow · 2–4 weeks",
      description:
        "We build your highest-ROI workflow from the audit and get it live fast. One thing, done right, proving its value in weeks. Not a season-long \"transformation\" that never lands.",
      features: [
        "24/7 call answering and booking, same-day quote follow-up, estimate-to-invoice, or whatever tops your list",
        "Built around the software you already run: ServiceTitan, Housecall Pro, Jobber, QuickBooks",
        "Team training so your office actually uses it",
        "Documentation and a fallback plan, so nothing depends on us being on speed dial",
      ],
    },
    {
      icon: ArrowPathIcon,
      step: "Step 3",
      title: "AI Partner Retainer",
      pricing: "Flat monthly rate",
      description:
        "Once the first workflow is earning its keep, we stay on as your AI partner: the fractional \"AI guy\" for shops that don't want to hire one. We keep what's built running, tune it as your business changes, and roll out the next workflow on the list.",
      features: [
        "Monitoring and upkeep on everything we've built",
        "A new workflow from your audit list rolled out on a steady cadence",
        "Ongoing team training as tools and staff change",
        "A direct line for questions. No ticket queues, no junior account reps",
      ],
    },
  ];

  const supporting = [
    {
      icon: AcademicCapIcon,
      title: "Tool selection & team training",
      description:
        "Already drowning in AI tool pitches? We cut through the noise, pick what actually fits your shop, and train your team to use it.",
    },
    {
      icon: PuzzlePieceIcon,
      title: "Custom integrations",
      description:
        "When off-the-shelf doesn't cut it, we build custom connections between the systems you already use so data stops getting retyped.",
    },
    {
      icon: PresentationChartLineIcon,
      title: "AI workshops for your team",
      description:
        "Hands-on training sessions that show your office and field staff how to use AI in their daily work: writing quotes faster, handling customer messages, cutting the busywork. Your team leaves using it that same day.",
    },
  ];

  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-900 tracking-tight mb-4">
            How We Work
          </h1>
          <p className="text-lg text-zinc-600 max-w-3xl mx-auto leading-relaxed">
            Three steps, in order. Each one is small enough to say yes to, and
            each one earns the next. Fixed prices at every stage. We don't
            bill hourly, ever.
          </p>
        </div>

        {/* The Ladder */}
        <div className="space-y-8 mb-24">
          {ladder.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="p-8 sm:p-10 rounded-2xl bg-white border border-zinc-200/50 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-zinc-700" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                      <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
                        {service.step}
                      </p>
                      <span className="text-sm font-medium text-zinc-900 bg-zinc-100 rounded-full px-3 py-1">
                        {service.pricing}
                      </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-zinc-900 mb-3 tracking-tight">
                      {service.title}
                    </h3>
                    <p className="text-zinc-600 mb-6 leading-relaxed">
                      {service.description}
                    </p>
                    <ul className="space-y-3">
                      {service.features.map((feature) => (
                        <li
                          key={feature}
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

        {/* Supporting Offerings */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight mb-3">
              Also in the Toolbox
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              Folded into any step above, or available on their own.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {supporting.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200/50"
                >
                  <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-zinc-700" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-zinc-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight mb-4">
            Step one costs less than the jobs you lost last week
          </h2>
          <p className="text-lg text-zinc-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Book the audit and find out exactly where the money is leaking.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Get Your AI Readiness Audit
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
