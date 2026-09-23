interface ShareableEnquiry {
  id?: string;
  title: string;
  budget?: number;
  location?: string;
  deadline?: any;
  isUrgent?: boolean;
  category?: string;
  categories?: string[];
  details?: any;
}

const formatBudget = (budget?: number): string | null => {
  if (!budget || budget <= 0) return null;
  return `₹${budget.toLocaleString('en-IN')}`;
};

const formatDeadline = (deadline: any): string | null => {
  if (!deadline) return null;
  try {
    const d = deadline.toDate ? deadline.toDate() : new Date(deadline);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    const days = Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
    if (days > 1) return `within ${days} days`;
    if (days === 1) return 'by tomorrow';
    if (days === 0) return 'today';
    return `by ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  } catch {
    return null;
  }
};

/** Job enquiries talk about salary, not budget. */
const isJobEnquiry = (enquiry: ShareableEnquiry): boolean =>
  [enquiry.category, ...(enquiry.categories || [])].some(
    (c) => c && (c === 'jobs' || c === 'job' || c.toLowerCase().includes('job'))
  );

/** Real-estate enquiries (rent/buy/lease aware). */
const isEstateEnquiry = (enquiry: ShareableEnquiry): boolean =>
  ['real-estate', 'real-estate-services'].includes(enquiry.category || '') ||
  (enquiry.categories || []).some((c) => ['real-estate', 'real-estate-services'].includes(c));

/** Pet enquiries read more naturally with "price range" than "budget". */
const isPetEnquiry = (enquiry: ShareableEnquiry): boolean =>
  [enquiry.category, ...(enquiry.categories || [])].some(
    (c) => c && c.toLowerCase().includes('pet')
  );

/**
 * Category-aware money line:
 *   Jobs hiring   → 💰 Salary: ₹50,000
 *   Jobs seeking  → 💰 Expected salary: ₹50,000
 *   Estate rent   → 💰 Rent: ₹25,000/month
 *   Estate lease  → 💰 Lease terms: ₹X
 *   Estate buy    → 💰 Budget: ₹1,00,000
 *   Pets          → 💰 Price range: ₹X
 *   Everything else → 💰 Buyer's budget: ₹X
 */
const moneyLine = (enquiry: ShareableEnquiry): string | null => {
  const budget = formatBudget(enquiry.budget);
  if (!budget) return null;

  if (isJobEnquiry(enquiry)) {
    return enquiry.details?.jobDirection === 'seeking'
      ? `💰 Expected salary: ${budget}`
      : `💰 Salary: ${budget}`;
  }
  if (isEstateEnquiry(enquiry)) {
    const t = enquiry.details?.listingType;
    if (t === 'Rent') return `💰 Rent: ${budget}/month`;
    if (t === 'Lease') return `💰 Lease terms: ${budget}`;
    return `💰 Budget: ${budget}`; // Buy and unknown → budget
  }
  if (isPetEnquiry(enquiry)) return `💰 Price range: ${budget}`;
  return `💰 Buyer's budget: ${budget}`;
};

/**
 * Deal-type suffix for real-estate enquiries — makes rent/buy/lease explicit in shares.
 * Reads `details.listingType` ("Buy" | "Rent" | "Lease") saved by PostEnquiry.
 */
const estateDealSuffix = (enquiry: ShareableEnquiry): string => {
  if (!isEstateEnquiry(enquiry)) return '';

  const listingType = enquiry.details?.listingType;
  if (listingType === 'Rent') return ' for rent';
  if (listingType === 'Lease') return ' for lease';
  if (listingType === 'Buy') return ' for buy';
  return '';
};

/**
 * Category-aware share text — sells the *need*, not the description.
 *
 * Products/vehicles example:
 *   🔎 WANTED: Hyundai Verna Fluidic 2011–2017 model
 *   💰 Buyer's budget: ₹5,00,000 | @ Visakhapatnam
 *   ⏰ Needed within 12 days
 *   Can you supply this? Respond here 👇
 *
 * Real-estate (rent) example:
 *   🔎 WANTED: 2 bhk House at Bombay for rent
 *   💰 Rent: ₹1,00,000/month | @ Kurla West, Mumbai
 *   ⏰ Needed within 14 days
 *   Have a property like this? Respond here 👇
 *
 * Jobs — hiring:
 *   👋 HIRING: Barista
 *   💰 Salary: ₹50,000 | @ Mannarkkad, Palakkad
 *   ⏰ Needed by tomorrow
 *   Apply or refer someone 👇
 *
 * Jobs — seeking:
 *   💼 SEEKING WORK: Barista
 *   💰 Expected salary: ₹50,000 | @ Mannarkkad, Palakkad
 *   ⏰ Available by tomorrow
 *   Hiring for this role? Respond here 👇
 */
export const buildEnquiryShareText = (enquiry: ShareableEnquiry, url: string): string => {
  const parts: string[] = [];
  const job = isJobEnquiry(enquiry);
  const seeking = job && enquiry.details?.jobDirection === 'seeking';

  // Headline: jobs get direction-specific prefixes; everything else is WANTED
  if (seeking) {
    parts.push(`${enquiry.isUrgent ? '⚡ URGENT — ' : ''}💼 SEEKING WORK: ${enquiry.title}`);
  } else if (job) {
    parts.push(`${enquiry.isUrgent ? '⚡ URGENT — ' : ''}👋 HIRING: ${enquiry.title}`);
  } else {
    parts.push(`${enquiry.isUrgent ? '⚡ URGENT — ' : ''}🔎 WANTED: ${enquiry.title}${estateDealSuffix(enquiry)}`);
  }

  const facts: string[] = [];
  const money = moneyLine(enquiry);
  if (money) facts.push(money);
  if (enquiry.location) facts.push(`@ ${enquiry.location}`);
  if (facts.length) parts.push(facts.join(' | '));

  // Job seekers "available" by a date; buyers "need" it
  const deadline = formatDeadline(enquiry.deadline);
  if (deadline) parts.push(seeking ? `⏰ Available ${deadline}` : `⏰ Needed ${deadline}`);

  // CTA per category
  let cta = 'Can you supply this? Respond here 👇';
  if (job) cta = seeking ? 'Hiring for this role? Respond here 👇' : 'Apply or refer someone 👇';
  else if (isEstateEnquiry(enquiry) && enquiry.details?.listingType === 'Rent') cta = 'Have a property like this? Respond here 👇';
  parts.push(cta);
  parts.push(url);

  return parts.join('\n');
};
