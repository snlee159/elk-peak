import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function About() {
  return (
    <div className="bg-white py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-900 tracking-tight mb-4">
            About Elk Peak Consulting
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            AI that works as hard as you do
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-6 tracking-tight">
              Our Mission
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Technology should serve the people who build, not distract them.
              The trades run this country: the HVAC techs, plumbers,
              electricians, welders, and builders who show up and do the work.
              But the businesses behind them are drowning in missed calls,
              late quotes, and paperwork that eats evenings and weekends.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              Elk Peak Consulting exists to fix that. We bring the AI tooling
              that big companies use, without the enterprise price tag or the
              enterprise nonsense, to shops that want to book more work with
              the crew they already have.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-6 tracking-tight">
              The Founder
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Before Elk Peak, our founder built AI field compliance tools for
              large-cap construction general contractors and utilities. That
              means AI that had to work in the field, for crews, under real
              conditions, on real jobsites. Not in a polished demo for a
              conference room.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              The Fortune 500 builders have entire teams for this. You get the
              same caliber of help without the enterprise price tag, from
              someone who has seen the office chaos behind a busy shop and
              knows the difference between a tool that helps and a tool that
              collects dust.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-6 tracking-tight">
              Why Choose Us
            </h2>
            <ul className="space-y-4 text-zinc-600">
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">
                    Proven in construction:
                  </strong>{" "}
                  We shipped AI into real field operations for major GCs and
                  utilities. We're not a generalist agency that pivoted to AI
                  last year
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">
                    We speak trades:
                  </strong>{" "}
                  No jargon, no buzzwords. We talk about calls booked, quotes
                  out the door, and hours back in your week
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">
                    Fixed prices:
                  </strong>{" "}
                  Every engagement is a fixed price agreed up front. We never
                  bill hourly
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">
                    One workflow at a time:
                  </strong>{" "}
                  We fix your biggest leak first and prove the value before
                  anything else gets built
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">
                    Measured ROI, no hype:
                  </strong>{" "}
                  If the numbers don't work, we'll tell you. Most AI projects
                  fail, and we'd rather walk away than add to that pile
                </span>
              </li>
            </ul>
          </section>

          <section className="text-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-zinc-800 no-underline"
            >
              Get Your AI Readiness Audit
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
