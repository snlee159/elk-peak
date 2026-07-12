import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  WrenchIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { upsideStats, trapStats } from "../data/stats";

function Citation({ source, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
    >
      {source}
      <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
    </a>
  );
}

export default function WhyAI() {
  const ladder = [
    {
      icon: MagnifyingGlassIcon,
      step: "Step 1",
      title: "AI Readiness Audit",
      description:
        "Fixed price, no strings. We sit down with you, map where hours and leads are leaking out of your business, and rank your automation opportunities by ROI. You walk away with a concrete plan that's yours to keep whether or not you hire us for the next step.",
    },
    {
      icon: WrenchIcon,
      step: "Step 2",
      title: "Pilot Build",
      description:
        "One workflow, fixed fee, live in 2–4 weeks. We build your highest-ROI automation (24/7 call answering, same-day quote follow-up, estimate-to-invoice), train your team on it, and document everything. You see real results before spending another dollar.",
    },
    {
      icon: ArrowPathIcon,
      step: "Step 3",
      title: "AI Partner Retainer",
      description:
        "A flat monthly rate to keep what we built running, tune it as your business changes, and roll out the next workflow on the list. The fractional \"AI guy\" for shops that don't want to hire one.",
    },
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-4">
            Why AI, Done Right
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-900 tracking-tight mb-6">
            AI is either your best hire or your most expensive subscription
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            The difference isn't the technology. It's the approach. Here's what
            the research says, and how we make sure you land on the right side
            of it.
          </p>
        </div>
      </section>

      {/* 1. The Opportunity */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
              The Opportunity
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
              Done well, the returns are real
            </h2>
            <p className="text-lg text-zinc-600 leading-relaxed">
              Trades businesses that put AI on the right jobs (answering the
              phone, chasing follow-ups, killing paperwork) are booking more
              work with the same crew.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {upsideStats.map((item) => (
              <div
                key={item.stat}
                className="p-8 rounded-2xl bg-white border border-zinc-200/50"
              >
                <p className="text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
                  {item.stat}
                </p>
                <p className="text-zinc-600 leading-relaxed mb-4">
                  {item.description}
                </p>
                <Citation source={item.source} url={item.url} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. The Trap */}
      <section className="py-24 bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
              The Trap
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-4">
              Most AI spending returns nothing
            </h2>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Here's the part the tool vendors won't tell you. Most businesses
              that buy AI get zero back. Not because the technology doesn't
              work, but because nobody wired it into how the business actually
              runs.
            </p>
          </div>

          <div className="space-y-8">
            {trapStats.map((item) => (
              <div
                key={item.stat}
                className="rounded-2xl bg-zinc-800/50 border border-zinc-700/50 p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  <p className="text-5xl font-semibold text-white tracking-tight flex-shrink-0">
                    {item.stat}
                  </p>
                  <div>
                    <p className="text-zinc-300 leading-relaxed mb-4">
                      {item.description}
                    </p>
                    {item.quote && (
                      <blockquote className="border-l-2 border-zinc-600 pl-4 mb-4">
                        <p className="text-zinc-400 italic leading-relaxed">
                          "{item.quote}"
                        </p>
                      </blockquote>
                    )}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {item.source}
                      <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The Difference */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
            The Difference
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight mb-6">
            It's not the tool. It's the approach.
          </h2>
          <div className="space-y-6 text-lg text-zinc-600 leading-relaxed">
            <p>
              The failed projects all look the same: a shiny tool bolted onto
              the side of the business, set up by someone who never asked how
              the shop actually runs. The office doesn't trust it, the crew
              ignores it, and six months later it's just another line item on
              the credit card statement.
            </p>
            <p>
              The projects that pay off look different. They start with one
              specific leak: the missed calls, the quotes that go out three
              days late, the follow-ups nobody sends. They get built around the
              way your team already works, with the software you already use.
              And they prove their value in weeks, not quarters, before anything
              else gets added.
            </p>
            <p className="text-zinc-900 font-medium">
              That's not a technology strategy. It's just how you'd run any
              job: scope it, build it right, inspect the work.
            </p>
          </div>
        </div>
      </section>

      {/* 4. The De-risked Path */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
              The Path
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
              How we de-risk it
            </h2>
            <p className="text-lg text-zinc-600 leading-relaxed">
              Three steps, each one small enough to say yes to, each one
              earning the next. Fixed prices at every stage, no hourly
              billing, no open-ended engagements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ladder.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-8 rounded-2xl bg-white border border-zinc-200/50"
                >
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-zinc-700" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-2">
                    {item.step}
                  </p>
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
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
            Start With the Audit
          </h2>
          <p className="text-lg text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            One fixed price. A clear map of where your business is leaking
            hours and leads, and a ranked plan to plug it. Yours to keep either
            way.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Book Your AI Readiness Audit
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
