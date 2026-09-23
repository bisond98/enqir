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

/**
 * Job enquiries talk about salary, not budget — mirrors PostEnquiry's
 * "Salary Offered / Salary Expected" labels.
 */
const isJobEnquiry = (enquiry: ShareableEnquiry): boolean =>
  [enquiry.category, ...(enquiry.categories || [])].some(
    (c) => c && (c === 'jobs' || c === 'job' || c.toLowerCase().includes('job'))
  );

/**
 * Deal-type suffix for real-estate enquiries — makes rent/buy/lease explicit in shares.
 * Reads `details.listingType` ("Buy" | "Rent" | "Lease") saved by PostEnquiry.
 */
const estateDealSuffix = (enquiry: ShareableEnquiry): string => {
  const isEstate =
    ['real-estate', 'real-estate-services'].includes(enquiry.category || '') ||
    (enquiry.categories || []).some((c) => ['real-estate', 'real-estate-services'].includes(c));
  if (!isEstate) return '';

  const listingType = enquiry.details?.listingType;
  if (listingType === 'Rent') return ' for rent';
  if (listingType === 'Lease') return ' for lease';
  if (listingType === 'Buy') return ' for buy';
  return '';
};

/**
 * Demand-focused share text for enquiries — sells the *need*, not the description.
 * Example:
 *   🔎 WANTED: Hyundai Verna Fluidic 2011–2017 model
 *   💰 Budget: ₹5,00,000 | 📍 Visakhapatnam
 *   ⏰ Needed within 12 days
 *   Can you supply this? Respond here 👇
 *
 * Real-estate example:
 *   🔎 WANTED: 2 bhk House at Bombay for rent
 *   💰 Buyer's budget: ₹1,00,000 | @ Kurla West, Mumbai
 *   ⏰ Needed within 14 days
 *   Can you supply this? Respond here 👇
 */
export const buildEnquiryShareText = (enquiry: ShareableEnquiry, url: string): string => {
  const parts: string[] = [];

  parts.push(`${enquiry.isUrgent ? '⚡ URGENT — ' : ''}🔎 WANTED: ${enquiry.title}${estateDealSuffix(enquiry)}`);

  const facts: string[] = [];
  const budget = formatBudget(enquiry.budget);
  if (budget) facts.push(isJobEnquiry(enquiry) ? `💰 Salary: ${budget}` : `💰 Buyer's budget: ${budget}`);
  if (enquiry.location) facts.push(`@ ${enquiry.location}`);
  if (facts.length) parts.push(facts.join(' | '));

  const deadline = formatDeadline(enquiry.deadline);
  if (deadline) parts.push(`⏰ Needed ${deadline}`);

  parts.push('Can you supply this? Respond here 👇');
  parts.push(url);

  return parts.join('\n');
};
