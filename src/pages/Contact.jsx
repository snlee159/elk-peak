import { useState } from "react";
import { Input, Field, Label } from "@/catalyst";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import emailjs from "@emailjs/browser";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error("EmailJS configuration is missing. Please check your environment variables.");
      }

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        company: formData.company || "Not provided",
        message: formData.message,
        to_name: "Elk Peak Consulting",
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      toast.success("Thank you! We'll be in touch soon.");
      setFormData({ name: "", email: "", company: "", message: "" });
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(
        error.message || "Failed to send message. Please try again or email us directly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-900 tracking-tight mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            Let's discuss how we can help your business grow
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 mb-6 tracking-tight">
              Contact Information
            </h2>
            <p className="text-zinc-600 mb-10 leading-relaxed">
              Reach out to us through any of these channels. We typically respond
              within 24 hours.
            </p>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <EnvelopeIcon className="w-6 h-6 text-zinc-700" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-2">Email</h3>
                  <a
                    href="mailto:contact@elkpeakconsulting.com"
                    className="text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    contact@elkpeakconsulting.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <PhoneIcon className="w-6 h-6 text-zinc-700" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-2">
                    Schedule a Call
                  </h3>
                  <p className="text-zinc-600 leading-relaxed">
                    Book a consultation to discuss your specific needs and how we can
                    help.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Field>
                <Label>Name</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Your name"
                />
              </Field>

              <Field>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="your.email@example.com"
                />
              </Field>

              <Field>
                <Label>Company (Optional)</Label>
                <Input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Your company name"
                />
              </Field>

              <Field>
                <Label>Message</Label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  rows={6}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  placeholder="Tell us about your project or how we can help..."
                />
              </Field>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
