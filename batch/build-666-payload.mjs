import { readFileSync, writeFileSync } from "node:fs";

const jdRaw = readFileSync("jds/666-searchapi-engineering-manager-2026-07-31.md", "utf8");
const body = jdRaw
  .replace(/^Source URL:.*?\n\n/s, "")
  .split("## Live Apply Form Signals")[0]
  .trim();

const payload = {
  source: "apply",
  reportId: "666",
  reportPath: "reports/666-searchapi-engineering-manager-2026-07-31.md",
  companyName: "SearchApi",
  roleTitle: "Engineering Manager",
  jobPostingUrl: "https://jobs.ashbyhq.com/SearchApi/58b2ffbf-58c6-447b-9ecd-e321e78de86a",
  pipelineStatus: { stage: "draft" },
  hasCoverLetterField: false,
  jobDescriptionText: body,
  questions: [
    {
      question: "Show automations you have built to run your team or your own work (screenshots or links), and one line each on the leverage they create.",
      answer: `I no longer have screenshots of the team automations because they lived on my company computer, but these are the main ones I built and still run personally.

Team systems at Riverside:
- Team management assistant: used Granola to transcribe my conversations, maintained a private memory per person of discussions and action points, reminded me about follow-ups in Slack, and fed a dashboard with ongoing issues, goals, and signals such as PRs and commits. Payoff: better-quality 1:1s, more accurate performance reviews, and much stronger attention to detail and to each person on the team.
- SLA triage agent: connected to Jira, pulled my open assigned tickets, inspected the relevant code, and drafted comments with questions or possible short- and long-term fixes for me to review and decide on. Payoff: I could spend my time on the decision instead of the initial investigation.

Personal agents I run today, using a local setup with memory and skills:
- Pay slip agent: generates the monthly pay slip for our cleaning person, saves the PDF to Drive, and sends me the exact amount to transfer, accounting for holidays and other variables. It calls the reference website's services directly over HTTP, so it stays current with policy changes. Payoff: the wire transfer is always on time, and instead of repeatedly filling a slow, awkward website, I receive the amount and a link to the PDF.
- SSN appointment agent: from a photo of a prescription, plus my calendar and preferences, it searches availability across nearby provinces and finds the most convenient appointment for me or my son through Italy's Servizio Sanitario Nazionale. If nothing suitable is available, it schedules a daily check and alerts me when a slot opens. Payoff: it removes the time-consuming work of checking each province and repeating the search every day.

Happy to walk through any of these live.`,
      includeInAiContext: false,
    },
    {
      question: "What do you actually watch to know the team is shipping? Beyond the obvious (velocity, uptime), name the real numbers you act on, the threshold that triggers you, and the last decision a metric forced on you.",
      answer: `Shipping means customer value reaches production consistently while the product stays stable and the code remains maintainable.

I start before implementation by watching planning rework: how often requirements or technical approaches bounce between Engineering, Product, and Design, and whether developers raise gaps and risks early. In production, I watch support-ticket volume by product area, the number and age of SLA tickets, incidents by severity, recurring bug patterns, and performance trends. I still track releases and completed work, but I read them alongside those quality signals.

The trigger depends on severity. A serious incident or customer-facing performance regression needs immediate action. For lower-severity signals, I look for a sustained increase above the team's normal baseline or the same issue appearing repeatedly across support, SLAs, and incidents. Then I investigate whether the cause is process, code quality, or missing pre-mortem and technical-design work.

A concrete example came when Platform had become the required reviewer for database-related changes because we were code owners for the models folder. That included schema and index changes, plus complex queries where teams needed our input. I watched the number and age of assigned PRs, repeated Slack pings on stale reviews, and complaints from teams being blocked. When that became a recurring pattern, we ran training sessions with MongoDB, created a backend champion in each team, and added those champions as code owners. Platform's review load fell by roughly 50%, and teams could ship with fewer dependencies while keeping database changes safe.`,
      includeInAiContext: false,
    },
    {
      question: "Walk us through one time you misjudged a person: kept a coasting dev too long, cut someone you shouldn't have, or let an A-player walk. The signals, what you did, and what you do differently now.",
      answer: `I misjudged two people in one succession decision. Before becoming Group Lead, I had promised the Dashboard Team Lead role to an engineer I saw as my natural successor. He was technically strong, ambitious, trusted by the team, and had covered for me successfully during vacations. The smaller warning signs were in communication outside the team, and I did not give them enough weight.

During his reserve duty in a conflict, a technically more experienced but recently hired developer, about six months into Riverside, became interim lead. I had doubts because he was new and I was not convinced he had the management skills. He exceeded my expectations in delegation, stakeholder communication, and cross-team work.

When my original choice returned under significant personal stress, the problems became much stronger. He became highly protective of the team, treated outside pressure as hostile, struggled to mediate or compromise, took too much on himself, and passed that stress into the team instead of translating it into context and safety. I honored my commitment and coached him, but I waited too long to make a change because I worried that moving him out of management would make him leave.

While I was coaching him, an opportunity opened to create a new team. I proposed the former interim lead, hired a team around him from scratch, and he built one of our strongest-performing teams. This happened before my original successor left, so he was no longer available when I suddenly needed a replacement. I ran the Platform team alongside my Group Lead role for several months.

I learned that communication in management is much broader than speaking clearly or being trusted inside the team. It includes mediation, compromise, stakeholder relationships, delegation, and protecting developers from raw organizational pressure while giving them the context they need. I now keep succession options open, assess that complete balance of skills, and put a time limit on role-fit coaching.`,
      includeInAiContext: false,
    },
  ],
};

writeFileSync("batch/apply-666-tracker-payload.json", JSON.stringify(payload, null, 2) + "\n");
console.log("payload written:", payload.questions.length, "questions,", body.length, "JD chars");
