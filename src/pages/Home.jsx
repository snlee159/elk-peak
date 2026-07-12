import { Link } from "react-router-dom";
import {
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { blogPosts } from "../data/blogPosts";
import { leakStats, upsideStats } from "../data/stats";

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-zinc-900 min-h-[600px] sm:min-h-[700px] flex items-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/hero-image.jpg)',
          }}
        />
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-zinc-900/45" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-sm font-medium text-zinc-300 uppercase tracking-wide mb-4">
              AI Consulting for the Trades &amp; Builders
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-white tracking-tight mb-6 text-balance">
              AI That Works As Hard As You{"\u00A0"}Do
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-200 mb-10 leading-relaxed">
              HVAC, plumbing, electrical, roofing, builders, and every trade in
              between. Stop losing jobs to missed calls and slow follow-ups. We
              set up AI that answers the phone, sends the quote, and chases the
              follow-up, so your crew can stay on the tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Get Your AI Readiness Audit
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/why-ai"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility Strip */}
      <section className="bg-zinc-50 border-b border-zinc-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="flex items-center justify-center gap-3 text-center text-sm sm:text-base text-zinc-600">
            <WrenchScrewdriverIcon className="h-5 w-5 flex-shrink-0 text-zinc-500" />
            <span>
              Founded by an engineer who built AI field tools for large-cap
              construction GCs and utilities
            </span>
          </p>
        </div>
      </section>

      {/* The Leak Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
              How much is your phone costing you?
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              You don't have a marketing problem. You have a leak. The jobs are
              calling. They're just not getting answered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {leakStats.map((item) => (
              <div
                key={item.stat}
                className="p-8 rounded-2xl bg-zinc-900 text-center"
              >
                <p className="text-4xl font-semibold text-white tracking-tight mb-4">
                  {item.stat}
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                  {item.description}
                </p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {item.source}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcome Pillars */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
              What We Fix
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              No jargon, no science projects. We plug the leaks that cost you
              money, one workflow at a time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-zinc-200/50 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                <BanknotesIcon className="w-7 h-7 text-zinc-700" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">
                Capture Revenue
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                Every call answered and every lead followed up in minutes.
                Nights, weekends, and while your crew is on the roof. The jobs
                that used to leak to competitors get booked instead.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-zinc-200/50 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                <ClipboardDocumentCheckIcon className="w-7 h-7 text-zinc-700" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">
                Delete Busywork
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                Quotes, invoices, scheduling, and review requests that run
                themselves. The hours your office spends retyping and chasing
                paperwork go back into billable work.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-zinc-200/50 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-7 h-7 text-zinc-700" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">
                Remove Risk
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                Processes that don't break when your one office person is out
                sick or on vacation. The business stops depending on a single
                set of hands to keep the wheels turning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
              The Numbers Don't Lie
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              Trades businesses that put AI to work the right way are seeing
              real, measurable returns.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {upsideStats.map((item) => (
              <div
                key={item.stat}
                className="p-8 rounded-2xl bg-white border border-zinc-200/50 hover:shadow-md transition-all"
              >
                <p className="text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
                  {item.stat}
                </p>
                <p className="text-zinc-600 leading-relaxed mb-4">
                  {item.description}
                </p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  {item.source}
                  <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
                </a>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              to="/why-ai"
              className="inline-flex items-center text-base font-medium text-zinc-900 hover:text-zinc-700 transition-colors"
            >
              Why most AI projects fail, and how we make sure yours doesn't
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Workshops Banner */}
      <section className="bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
                Want your team trained, not just tooled up?
              </h2>
              <p className="text-zinc-300 leading-relaxed max-w-2xl">
                We run hands-on AI workshops for your office and field staff.
                Everyone learns practical ways to work faster with AI and
                leaves using it that same day.
              </p>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100 flex-shrink-0"
            >
              Learn About Workshops
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
              From the Blog
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              Straight talk on automation and running a tighter shop
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...blogPosts]
              .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
              .map((post) => (
                <a
                  key={post.url}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-2xl bg-white border border-zinc-200/50 overflow-hidden hover:shadow-lg hover:border-zinc-300/50 transition-all"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-zinc-100">
                    <img
                      src={post.coverImage}
                      alt=""
                      className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-zinc-900 mb-2 tracking-tight group-hover:text-zinc-700">
                      {post.title}
                    </h3>
                    <p className="text-zinc-600 text-sm leading-relaxed line-clamp-2">
                      {post.description}
                    </p>
                    <span className="inline-flex items-center mt-4 text-sm font-medium text-zinc-900 group-hover:text-zinc-700">
                      Read on Medium
                      <ArrowTopRightOnSquareIcon className="ml-1.5 h-4 w-4" />
                    </span>
                  </div>
                </a>
              ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
            Find Out Where Your Business Is Leaking
          </h2>
          <p className="text-lg text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Start with a fixed-price AI Readiness Audit. We map where hours and
            leads are slipping away, rank your best opportunities by ROI, and
            hand you a plan that's yours to keep, whether or not you hire us.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Get Your AI Readiness Audit
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
