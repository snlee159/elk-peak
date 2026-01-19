export default function About() {
  return (
    <div className="bg-white py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-900 tracking-tight mb-4">
            About Elk Peak Consulting
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            Helping businesses leverage technology to achieve their goals
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-6 tracking-tight">
              Our Mission
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              At Elk Peak Consulting, we believe that every business, regardless of
              size, deserves access to cutting-edge technology solutions. We specialize
              in helping businesses build their online presence, implement AI-powered
              automations, and organize their tech infrastructure for maximum efficiency.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              Our approach is practical, results-driven, and tailored to each client's
              unique needs. We don't just implement technology—we ensure it works for
              your business.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-6 tracking-tight">
              What We Do
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-6">
              We offer a comprehensive range of tech services designed to help modern
              businesses thrive:
            </p>
            <ul className="space-y-4 text-zinc-600">
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">Online Presence:</strong>{" "}
                  Optimize your Google Business Profile and local SEO to attract more
                  customers
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">AI Automations:</strong>{" "}
                  Implement intelligent customer service and sales automation systems
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">Tech Organization:</strong>{" "}
                  Streamline your tech stack and organize your digital infrastructure
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">Custom Solutions:</strong>{" "}
                  Build tailored technology solutions for your specific business needs
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-900 mb-6 tracking-tight">
              Why Choose Us
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-6">
              We understand that technology can be overwhelming. That's why we focus on
              solutions that are:
            </p>
            <ul className="space-y-4 text-zinc-600">
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">Practical:</strong>{" "}
                  Solutions that solve real business problems
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">Scalable:</strong>{" "}
                  Technology that grows with your business
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">Affordable:</strong>{" "}
                  Cost-effective solutions for businesses of all sizes
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-zinc-900 mr-3 font-medium">•</span>
                <span>
                  <strong className="text-zinc-900 font-semibold">Supportive:</strong>{" "}
                  Ongoing support to ensure your success
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
