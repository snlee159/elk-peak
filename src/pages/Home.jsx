import { Link } from "react-router-dom";
import {
  MapPinIcon,
  SparklesIcon,
  CpuChipIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { blogPosts } from "../data/blogPosts"; 

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-zinc-900 min-h-[600px] sm:min-h-[700px] flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/hero-image.png)',
          }}
        />
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-zinc-900/60" />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-sm font-medium text-zinc-300 uppercase tracking-wide mb-4">
              Tech Consulting Services
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-white tracking-tight mb-6">
              Elk Peak Consulting
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-200 mb-10 leading-relaxed">
              Transform your business through intentional technology. From building your online presence to AI-powered automations, we help businesses leverage technology to grow and thrive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/services"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Explore Services
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                Book Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              Comprehensive tech services thoughtfully designed to help your business succeed in the digital age
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-zinc-200/50 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                <MapPinIcon className="w-7 h-7 text-zinc-700" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">
                Online Presence
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                Google Maps business profiles, local SEO, and digital visibility optimization
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-zinc-200/50 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                <SparklesIcon className="w-7 h-7 text-zinc-700" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">
                AI Automations
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                Customer service bots, sales automation, and intelligent workflows that save time and money
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-zinc-200/50 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                <CpuChipIcon className="w-7 h-7 text-zinc-700" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">
                Tech Organization
              </h3>
              <p className="text-zinc-600 leading-relaxed">
                Streamline your tech stack, optimize workflows, and organize your digital infrastructure
              </p>
            </div>
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
              Insights on technology, automation, and growing your business
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
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Let's discuss how we can help you leverage technology to achieve your goals.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Get in Touch
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

