/**
 * Research-backed stats shared by the Home page and Why AI page.
 * Three groups: the leak (trades-specific pain), the upside (AI done well),
 * and the trap (AI done poorly). Each entry carries its citation.
 */

export const leakStats = [
  {
    stat: "40–70%",
    description:
      "of inbound calls to home service contractors go unanswered. Technicians are on job sites and physically can't pick up.",
    source: "Dialfyne Missed Call Benchmarks, 2026",
    url: "https://dialfyne.com/missed-call-statistics",
  },
  {
    stat: "$75K–$250K",
    description:
      "in revenue the average home service contractor loses every year to missed calls alone.",
    source: "Dialfyne Missed Call Benchmarks, 2026",
    url: "https://dialfyne.com/missed-call-statistics",
  },
  {
    stat: "85%",
    description:
      "of callers who reach voicemail never call back. Most call a competitor within two minutes.",
    source: "Invoca via ACHR News, 2026",
    url: "https://www.achrnews.com/articles/166041-crawl-walk-run-how-hvac-contractors-are-successfully-adopting-ai-in-2026",
  },
  {
    stat: "35–45%",
    description:
      "of HVAC calls come in outside business hours, exactly when emergencies happen and job values are highest.",
    source: "Epiphany Dynamics via ACHR News, 2026",
    url: "https://www.achrnews.com/articles/166041-crawl-walk-run-how-hvac-contractors-are-successfully-adopting-ai-in-2026",
  },
];

export const upsideStats = [
  {
    stat: "68%",
    description:
      "of trade pros using AI say it has contributed to their revenue growth, and nearly half of home service pros now actively use it.",
    source: "Housecall Pro, AI in the Trades Survey, 2026",
    url: "https://www.housecallpro.com/resources/ai-in-the-trades/",
  },
  {
    stat: "25%",
    description:
      "growth in follow-up sales on unsold estimates for one HVAC contractor after putting AI on estimate follow-ups.",
    source: "ACHR News, 2026",
    url: "https://www.achrnews.com/articles/166041-crawl-walk-run-how-hvac-contractors-are-successfully-adopting-ai-in-2026",
  },
  {
    stat: "2–3x",
    description:
      "better appointment set rates when speed-to-lead drops from hours to under a minute.",
    source: "ACHR News, 2026",
    url: "https://www.achrnews.com/articles/166041-crawl-walk-run-how-hvac-contractors-are-successfully-adopting-ai-in-2026",
  },
  {
    stat: "160+ hrs",
    description:
      "recovered per year. Contractors using AI save an average of 3.2 hours a week on admin like emails, data entry, and follow-ups.",
    source: "Housecall Pro Contractor Survey",
    url: "https://chathamoaks.co/guidebook/ai-tools-contractors-plumbers-hvac",
  },
  {
    stat: "16.5 hrs/week",
    description:
      "the median combined time small business owners get back with AI: 5 hours of their own plus 11.5 employee hours.",
    source: "SBE Council Small Business Survey, March 2026",
    url: "https://sbecouncil.org/wp-content/uploads/2026/03/SBE-Technology-Use-Survey-March-2026-Final.pdf",
  },
  {
    stat: "$3.70",
    description:
      "average return for every $1 invested in generative AI when it's implemented well.",
    source: "IDC AI Opportunity Study",
    url: "https://blogs.microsoft.com/blog/2024/11/12/idcs-2024-ai-opportunity-study-top-five-ai-trends-to-watch/",
  },
];

export const trapStats = [
  {
    stat: "95%",
    quote:
      "Despite $30–40 billion in enterprise investment into GenAI... 95% of organizations are getting zero return. Most fail due to brittle workflows, lack of contextual learning, and misalignment with day-to-day operations.",
    description:
      "of enterprise AI pilots deliver no measurable financial impact.",
    source: "MIT NANDA, State of AI in Business 2025",
    url: "https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf",
  },
  {
    stat: "89%",
    description:
      "of firms report no measurable productivity impact from AI, in a survey of 6,000 executives.",
    source: "National Bureau of Economic Research",
    url: "https://aibusinessweekly.net/p/ai-productivity-statistics",
  },
];
