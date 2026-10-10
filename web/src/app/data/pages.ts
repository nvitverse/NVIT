import { SITE } from '../site.config';

export interface ServiceInfo { slug: string; name: string; h1: string; desc: string; points: string[]; body: string[] }
export const SERVICES: ServiceInfo[] = [
  { slug: 'one-way-taxi', name: 'One Way Taxi', h1: 'One Way Taxi Service', desc: 'Pay only for the one-way distance between cities. No empty return charge.',
    points: ['Pay one-way distance only', 'Minimum 130 km billing', 'Fare shown before you book', 'Driver details shared before pickup'],
    body: ['A one way taxi takes you from city A to city B and ends the trip there. You are not billed for the driver’s empty journey back, which makes it the most economical way to travel between cities when you do not need a return cab.', 'Fares are calculated per kilometre of the one-way distance plus a driver allowance. Tolls, state permit and parking are extra at actuals.'] },
  { slug: 'drop-taxi', name: 'Drop Taxi', h1: 'Drop Taxi Service', desc: 'Doorstep pickup and drop to any city on our network.',
    points: ['Doorstep pickup', 'Drop anywhere in the destination city', 'Clean AC cars', '24/7 booking support'],
    body: ['Drop taxi is the everyday name for a one-way intercity cab. Book from your home, hotel or office, and get dropped at your destination address.', 'Popular drop routes include Chennai to Bangalore, Chennai to Madurai, Coimbatore to Chennai and Bangalore to Chennai.'] },
  { slug: 'outstation-taxi', name: 'Outstation Taxi', h1: 'Outstation Taxi Booking', desc: 'Outstation cabs for family trips, pilgrimages and business travel.',
    points: ['One way and round trip', 'Sedan to Tempo Traveller', 'Multi-day trips', 'Temple and hill-station packages'],
    body: ['Plan a trip to a temple, hill station or another city with an outstation taxi. Choose one way if you are relocating or returning by other means, or round trip if you want the same cab for the whole journey.', 'For multi-day trips, billing uses the higher of the daily minimum kilometres or the actual distance.'] },
  { slug: 'round-trip-taxi', name: 'Round Trip Taxi', h1: 'Round Trip Taxi', desc: 'Keep the same cab and driver for your whole trip.',
    points: ['Same cab for the whole trip', 'Driver allowance per day', 'Flexible stops', 'Billed on the higher of 250 km/day or actual km'],
    body: ['With a round trip you keep one cab and driver from start to finish. Billing uses the higher of 250 km per day or the actual round-trip distance, plus driver allowance for each day.'] },
  { slug: 'airport-transfer', name: 'Airport Transfer', h1: 'Airport Taxi Transfer', desc: 'On-time airport pickup and drop.',
    points: ['Flight-time pickup', 'Meet at arrivals', 'Luggage friendly cars', 'Available 24/7'],
    body: ['Share your flight details and we schedule the cab around them. For early-morning flights we recommend booking the previous day.'] },
  { slug: 'local-rental', name: 'Local Rental', h1: 'Local Rental Cab', desc: 'Hourly and day rentals inside the city.',
    points: ['Hourly packages', 'Multiple stops', 'Wait time friendly', 'Sedan, SUV and Innova'],
    body: ['Need a cab for shopping, meetings or a wedding day inside the city? Rent a car with a driver by the hour or by the day. Call us for the current local package rates.'] }
];

export interface StaticPage { key: string; path: string; title: string; h1: string; desc: string; sections: { h: string; p: string }[] }
const P = SITE.phone;
export const PAGES: StaticPage[] = [
  { key: 'about', path: '/about', title: `About ${SITE.brand} | One Way Drop Taxi`, h1: `About ${SITE.brand}`, desc: `${SITE.brand} provides one-way drop taxis and outstation cabs across Tamil Nadu, Bangalore, Pondicherry and Tirupati.`,
    sections: [{ h: 'What we do', p: `${SITE.brand} connects travellers with one-way and outstation cabs between cities in Tamil Nadu, Pondicherry, Bangalore and Tirupati. You see the fare before you book and pay only for the distance you travel.` },
      { h: 'How we work', p: 'Share pickup, drop and date. We confirm the vehicle and fare, and send driver and car details before pickup.' }] },
  { key: 'contact', path: '/contact', title: `Contact ${SITE.brand} | Call ${P}`, h1: 'Contact us', desc: `Call or WhatsApp ${P} to book a one way drop taxi or outstation cab. Available 24/7.`,
    sections: [{ h: 'Call or WhatsApp', p: `Phone and WhatsApp: ${P}. We take bookings 24/7.` }, { h: 'Service area', p: 'Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana and Puducherry.' }] },
  { key: 'faq', path: '/faq', title: `Drop Taxi FAQ | ${SITE.brand}`, h1: 'Frequently asked questions', desc: 'Answers on one way taxi fares, tolls, permits, cancellation and booking.', sections: [] },
  { key: 'terms', path: '/terms', title: `Terms & Conditions | ${SITE.brand}`, h1: 'Terms & conditions', desc: `Booking terms for ${SITE.brand}.`,
    sections: [{ h: 'Fares', p: 'Fares are quoted per kilometre plus driver allowance. Tolls, state permit, parking and hill-station charges are extra at actuals.' }, { h: 'Minimum billing', p: `One way trips are billed for a minimum of 130 km. Round trips are billed on the higher of 250 km per day or actual distance.` }, { h: 'Draft notice', p: 'DRAFT: have this page reviewed and finalised by the business owner before launch.' }] },
  { key: 'privacy', path: '/privacy-policy', title: `Privacy Policy | ${SITE.brand}`, h1: 'Privacy policy', desc: `How ${SITE.brand} handles your booking details.`,
    sections: [{ h: 'What we collect', p: 'Name, mobile number, pickup and drop details that you submit in the booking form.' }, { h: 'How we use it', p: 'Only to confirm and operate your booking and to contact you about it. We do not sell your data.' }, { h: 'Draft notice', p: 'DRAFT: finalise with the business owner before launch.' }] },
  { key: 'cancellation', path: '/cancellation-policy', title: `Cancellation Policy | ${SITE.brand}`, h1: 'Cancellation policy', desc: `Cancellation terms for ${SITE.brand} bookings.`,
    sections: [{ h: 'Cancellation', p: 'Please inform us as early as possible if your plan changes. Cancellation charges, if any, are confirmed at booking.' }, { h: 'Draft notice', p: 'DRAFT: set exact cancellation windows and charges before launch.' }] }
];

const DRAFT = { h: 'Review notice', p: 'DRAFT: these terms are sensible defaults. The business owner should review and confirm them before launch.' };
PAGES.push(
  { key: 'toll', path: '/toll-permit', title: `Toll & State Permit Charges | ${SITE.brand}`, h1: 'Toll & state permit charges', desc: 'How toll, state permit/border charges, parking and hill-station fees work on one way and outstation taxi trips.',
    sections: [
      { h: 'Toll', p: 'Highway toll is not part of the per-km fare. It is paid at toll plazas and charged at actuals. When Google route data is available, the fare page shows an estimated toll for your route; choose "Includes toll" to add it to the fare estimate.' },
      { h: 'State permit / border charges', p: 'Trips that cross a state border (for example Tamil Nadu to Kerala, Karnataka or Andhra Pradesh) attract state permit or border entry charges. These are charged at actuals as per the rules of the states concerned.' },
      { h: 'Parking, hill-station and other fees', p: 'Parking, hill-station entry (such as Ooty or Kodaikanal), temple vehicle entry and similar fees are paid by the customer at actuals.' },
      { h: 'Driver allowance (batta)', p: 'Driver allowance is already included in the quoted fare. It is shown as a separate line in the fare breakdown.' },
      DRAFT ] },
  { key: 'luggage', path: '/luggage-policy', title: `Luggage Policy | ${SITE.brand}`, h1: 'Luggage policy', desc: 'Luggage allowance for sedan, SUV and Innova taxis, and how to arrange extra luggage.',
    sections: [
      { h: 'Allowance', p: 'Each cab carries a limited amount of luggage: Sedan 3 bags, SUV 5 bags, Innova 6 bags, Innova Crysta 6 bags (standard suitcases, with passengers seated). Please check the cab details on the fare page.' },
      { h: 'Extra luggage', p: 'If you have more luggage than the allowance, choose a larger cab or tell us when booking so we can arrange a suitable vehicle. Roof carriers are not provided.' },
      { h: 'Prohibited items', p: 'Illegal goods, hazardous or flammable materials and items that can damage the vehicle are not allowed.' },
      DRAFT ] },
  { key: 'pet', path: '/pet-travel-policy', title: `Pet Travel Policy | ${SITE.brand}`, h1: 'Pet travel policy', desc: 'Travelling with pets: please inform us at booking so we can confirm a suitable cab.',
    sections: [
      { h: 'Informing us', p: 'Well-behaved pets can travel in our taxis if the driver is informed at the time of booking. Please mention your pet when you book on WhatsApp or call.' },
      { h: 'Your responsibility', p: 'Pets should be leashed or in a carrier, and the owner is responsible for cleanliness and any damage. A cleaning charge may apply if the cab needs special cleaning.' },
      DRAFT ] },
  { key: 'refund', path: '/refund-policy', title: `Refund Policy | ${SITE.brand}`, h1: 'Refund policy', desc: `Refund terms for ${SITE.brand} bookings.`,
    sections: [
      { h: 'Advance payments', p: 'The website does not collect payment online. If you paid an advance to our team, it will be refunded as per the cancellation terms confirmed at booking.' },
      { h: 'How refunds are made', p: 'Eligible refunds are returned to the same method used for the payment within 5–7 working days.' },
      DRAFT ] },
  { key: 'payment', path: '/payment-policy', title: `Payment Policy | ${SITE.brand}`, h1: 'Payment policy', desc: `How fares are paid on ${SITE.brand} trips.`,
    sections: [
      { h: 'Fare', p: 'The fare shown on the website is an estimate based on distance and the selected cab. The final fare is confirmed by our team and is based on the actual kilometres travelled, plus toll, state permit, parking and other extras at actuals.' },
      { h: 'Payment', p: 'Online payment is not collected on the website at the moment. Payment terms are confirmed by our team on call or WhatsApp when your booking is confirmed.' },
      DRAFT ] }
);

export const GENERAL_FAQ = [
  { q: 'What is a one way drop taxi?', a: 'A one way drop taxi takes you from one city to another and you pay only for the one-way distance, not the return.' },
  { q: 'How is the fare calculated?', a: 'One way: the higher of actual km or 130 km, multiplied by the per-km rate, plus driver allowance. Round trip: the higher of 250 km per day or twice the one-way distance, plus driver allowance per day.' },
  { q: 'Are toll and permit charges included?', a: 'No. Toll, state permit, parking and hill-station entry charges are extra at actuals.' },
  { q: 'How do I book?', a: `Use the booking form on any page or call/WhatsApp ${SITE.phone}.` },
  { q: 'Can I book at night or early morning?', a: 'Yes. Bookings are taken 24/7.' },
  { q: 'Which cars can I choose?', a: 'Sedan, SUV (Ertiga), Innova, Innova Crysta and Tempo Traveller.' }
];
