// Sample data for demos: features, facilities, three rooms and five bookings waiting to be confirmed.
// Run with `npm run seed`. Safe to run again: rooms that already exist are left alone (they only get room numbers if they have none).
// All prices, sizes and descriptions here are made up.

import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

// The sample room photos, kept on the hotel's Cloudinary account.
const SAMPLE_PHOTOS = 'https://res.cloudinary.com/s5lzrbqa/image/upload/';

const prisma = new PrismaClient();

const FEATURES = [
  { name: 'Bedroom', icon: 'bed-double', description: 'Separate bedroom with a king-size bed and blackout curtains.' },
  { name: 'Balcony', icon: 'door-open', description: 'Private balcony with two chairs and a small table.' },
  { name: 'Sofa', icon: 'sofa', description: 'Comfortable sofa seating area inside the room.' },
  { name: 'Sea View', icon: 'sunset', description: 'Uninterrupted view of the Indian Ocean from the room.' },
  { name: 'Garden View', icon: 'trees', description: 'Looks out over the tropical garden and palm trees.' },
  { name: 'Private Pool', icon: 'waves-ladder', description: 'Your own plunge pool, not shared with other guests.' },
  { name: 'Kitchenette', icon: 'cooking-pot', description: 'Small kitchen corner with a hob, sink and basic utensils.' },
  { name: 'Work Desk', icon: 'lamp-desk', description: 'Desk and chair with power sockets close by.' },
];

const FACILITIES = [
  { name: 'WiFi', icon: 'wifi', description: 'Free high-speed WiFi in every room and all public areas.' },
  { name: 'Air Conditioner', icon: 'air-vent', description: 'Individually controlled air conditioning.' },
  { name: 'Television', icon: 'tv', description: 'Flat-screen TV with satellite channels.' },
  { name: 'Hot Water', icon: 'shower-head', description: 'Hot water around the clock with a rain shower.' },
  { name: 'Mini Bar', icon: 'refrigerator', description: 'In-room fridge stocked with soft drinks and snacks.' },
  { name: 'Tea & Coffee', icon: 'coffee', description: 'Kettle with complimentary Ceylon tea and coffee.' },
  { name: 'Room Service', icon: 'concierge-bell', description: 'Meals and drinks brought to your room from 7 am to 10 pm.' },
  { name: 'Spa', icon: 'flower-2', description: 'Access to the spa with Ayurvedic treatments and massage.' },
  { name: 'Safe', icon: 'vault', description: 'Electronic safe for passports and valuables.' },
];

const ROOMS = [
  {
    name: 'Deluxe Ocean View Room',
    description:
      'A bright room on the upper floor with floor-to-ceiling doors opening onto a private balcony over the ocean. Wake up to the sound of the waves, then step out for sunrise with a cup of Ceylon tea.\n\nIdeal for couples, with space for one child.',
    price: 28000,
    area: 420,
    quantity: 6,
    roomNumbers: ['101', '102', '103', '104', '105', '106'],
    maxAdults: 2,
    maxChildren: 1,
    images: ['v1792645554/n34-mirissa/rooms/rtvxnhphrtwnaxmczeeo.jpg', 'v1792645557/n34-mirissa/rooms/vx5ximzxkmqp3ta8xdw8.jpg', 'v1792645560/n34-mirissa/rooms/iercwqlodhbfgfl4avcj.jpg'],
    features: ['Bedroom', 'Balcony', 'Sea View', 'Work Desk'],
    facilities: ['WiFi', 'Air Conditioner', 'Television', 'Hot Water', 'Tea & Coffee', 'Safe'],
  },
  {
    name: 'Family Garden Suite',
    description:
      'A spacious ground-floor suite that opens straight onto the tropical garden. A separate bedroom, a living area with a sofa, and a kitchenette give families room to spread out.\n\nSleeps up to four adults and two children.',
    price: 42000,
    area: 680,
    quantity: 3,
    roomNumbers: ['G01', 'G02', 'G03'],
    maxAdults: 4,
    maxChildren: 2,
    images: ['v1792645562/n34-mirissa/rooms/ejl7vtvm7we1denl587v.jpg', 'v1792645565/n34-mirissa/rooms/dtogszrbqzrovhjn6v0i.jpg', 'v1792645567/n34-mirissa/rooms/ui9j4ch6s6i2raydgvha.jpg'],
    features: ['Bedroom', 'Sofa', 'Garden View', 'Kitchenette', 'Work Desk'],
    facilities: ['WiFi', 'Air Conditioner', 'Television', 'Hot Water', 'Mini Bar', 'Tea & Coffee', 'Room Service'],
  },
  {
    name: 'Beachfront Pool Villa',
    description:
      'Our most private stay: a stand-alone villa a few steps from the sand, with its own plunge pool and sun deck facing the sea. Inside, an open-plan bedroom and lounge with a sofa and a large bathroom.\n\nPerfect for honeymoons and special occasions.',
    price: 75000,
    area: 1100,
    quantity: 2,
    roomNumbers: ['V1', 'V2'],
    maxAdults: 2,
    maxChildren: 2,
    images: ['v1792645569/n34-mirissa/rooms/zy9xhjgtr1d9i5izh1wb.jpg', 'v1792645573/n34-mirissa/rooms/ziwerwboakw6cqcclr2p.jpg', 'v1792645575/n34-mirissa/rooms/y57nayfctdfu8n7h5ift.jpg'],
    features: ['Bedroom', 'Balcony', 'Sofa', 'Sea View', 'Private Pool'],
    facilities: ['WiFi', 'Air Conditioner', 'Television', 'Hot Water', 'Mini Bar', 'Tea & Coffee', 'Room Service', 'Spa', 'Safe'],
  },
];

// Creates the feature or facility, or tidies one that already exists under the same name
// (fixes the capitalisation and fills in a missing icon or description). Returns name -> id.
async function seedAmenities(model, items, label) {
  const ids = new Map();
  let created = 0;

  for (const item of items) {
    const existing = await model.findFirst({ where: { name: { equals: item.name, mode: 'insensitive' } } });

    if (!existing) {
      ids.set(item.name, (await model.create({ data: item })).id);
      created++;
      continue;
    }

    // "Suggested from the name" is the icon hint text, saved as a description by mistake.
    const hasRealDescription = existing.description && existing.description !== 'Suggested from the name';
    await model.update({
      where: { id: existing.id },
      data: {
        name: item.name,
        icon: existing.icon ?? item.icon,
        description: hasRealDescription ? existing.description : item.description,
      },
    });
    ids.set(item.name, existing.id);
  }

  console.log(`${label}: ${created} added, ${items.length - created} already there`);
  return ids;
}

// Five bookings still waiting for the hotel, so the admin "New bookings" screen has something to work with.
// Fixed references make this safe to run again. Dates are counted from the day the script runs.
const MEAL_PRICE_PER_GUEST_NIGHT = { ROOM_ONLY: 0, BED_AND_BREAKFAST: 1500, HALF_BOARD: 3500, FULL_BOARD: 5500 }; // keep in step with src/lib/booking.ts

const SAMPLE_BOOKINGS = [
  { reference: 'N34-DEMO01', room: 'Deluxe Ocean View Room', guestName: 'Nimal Perera', email: 'nimal.perera@example.com', phone: '071 456 7890', startsIn: 3, nights: 2, adults: 2, children: 0, mealPlan: 'BED_AND_BREAKFAST', specialRequests: 'Late check-in, around 9 pm.' },
  { reference: 'N34-DEMO02', room: 'Family Garden Suite', guestName: 'Sarah Thompson', email: 'sarah.thompson@example.com', phone: '+44 7700 900123', startsIn: 5, nights: 4, adults: 2, children: 2, mealPlan: 'HALF_BOARD', specialRequests: 'A baby cot, please.' },
  { reference: 'N34-DEMO03', room: 'Beachfront Pool Villa', guestName: 'Kasun Jayasinghe', email: 'kasun.j@example.com', phone: '077 321 6540', startsIn: 8, nights: 3, adults: 2, children: 0, mealPlan: 'FULL_BOARD', specialRequests: 'Honeymoon stay.' },
  { reference: 'N34-DEMO04', room: 'Deluxe Ocean View Room', guestName: 'Aisha Fernando', email: 'aisha.fernando@example.com', phone: '076 880 1122', startsIn: 12, nights: 1, adults: 1, children: 0, mealPlan: 'ROOM_ONLY', specialRequests: null },
  { reference: 'N34-DEMO05', room: 'Family Garden Suite', guestName: 'Daniel Müller', email: 'daniel.mueller@example.com', phone: '+49 151 23456789', startsIn: 15, nights: 5, adults: 3, children: 1, mealPlan: 'BED_AND_BREAKFAST', specialRequests: 'Vegetarian meals.' },
];

// Midnight UTC on the hotel's calendar day (Sri Lanka), the same way the site stores stay dates.
function stayDate(daysFromToday) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date());
  return new Date(new Date(`${today}T00:00:00.000Z`).getTime() + daysFromToday * 24 * 60 * 60 * 1000);
}

async function seedBookings() {
  let created = 0;
  for (const { room: roomName, startsIn, nights, ...sample } of SAMPLE_BOOKINGS) {
    if (await prisma.booking.findUnique({ where: { reference: sample.reference } })) continue;

    const room = await prisma.room.findFirst({ where: { name: roomName } });
    if (!room) continue;

    const mealTotal = MEAL_PRICE_PER_GUEST_NIGHT[sample.mealPlan] * (sample.adults + sample.children) * nights;
    await prisma.booking.create({
      data: {
        ...sample,
        roomId: room.id,
        checkIn: stayDate(startsIn),
        checkOut: stayDate(startsIn + nights),
        pricePerNight: room.price,
        mealTotal,
        totalAmount: room.price * nights + mealTotal,
        // Made without an account, like a walk-in guest on the website.
        guestToken: randomBytes(24).toString('hex'),
      },
    });
    created++;
  }
  console.log(`Bookings: ${created} added, ${SAMPLE_BOOKINGS.length - created} already there`);
}

// A few questions from the Contact Us page, so the admin Messages screen has something to show.
const SAMPLE_MESSAGES = [
  { name: 'Emma Wilson', email: 'emma.wilson@example.com', phone: '+44 7700 900456', subject: 'Airport transfer from Colombo', message: 'Hello! We land at Bandaranaike Airport on the 20th around 6 am. Can you arrange a car to Mirissa, and how much would it cost for two people with two suitcases?', hoursAgo: 3 },
  { name: 'Tharindu Silva', email: 'tharindu.s@example.com', phone: '077 445 1290', subject: 'Honeymoon package', message: 'We are getting married next month and would love to stay in the Beachfront Pool Villa for three nights.\nDo you offer any honeymoon decorations or a candlelight dinner on the beach?', hoursAgo: 20 },
  { name: 'Marco Rossi', email: 'marco.rossi@example.com', phone: null, subject: 'Group booking for 12 people', message: 'We are a group of 12 friends travelling in December. Could we book four rooms together and get a group rate? We would also like to go whale watching.', hoursAgo: 50 },
  { name: 'Nadeesha Perera', email: 'nadeesha.p@example.com', phone: '071 223 4455', subject: 'Is breakfast included?', message: 'Hi, is breakfast included in the Deluxe Ocean View Room price, or is it extra?', hoursAgo: 96, reply: 'Hello Nadeesha, thank you for your message. Breakfast is not included in the room price, but you can add it for LKR 1,500 per guest per night when you book. We look forward to welcoming you!' },
];

async function seedMessages() {
  let created = 0;
  for (const { hoursAgo, reply, ...sample } of SAMPLE_MESSAGES) {
    if (await prisma.contactMessage.findFirst({ where: { email: sample.email, subject: sample.subject } })) continue;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    await prisma.contactMessage.create({
      data: { ...sample, createdAt, isRead: !!reply, reply: reply ?? null, repliedAt: reply ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : null },
    });
    created++;
  }
  console.log(`Messages: ${created} added, ${SAMPLE_MESSAGES.length - created} already there`);
}

// Breakfast, lunch and dinner with a short sample menu. Prices are made up; photos are site placeholders until the admin uploads real ones.
const MEALS = [
  {
    key: 'BREAKFAST',
    title: 'Breakfast',
    tagline: 'Start the day by the sea',
    hours: '7:00 – 10:30 am',
    description: 'A slow breakfast on the terrace with the sound of the waves: Sri Lankan favourites made fresh each morning, tropical fruit from the market, and Ceylon tea or coffee.',
    imageUrl: '/images/hero-2.jpg',
    items: [
      { name: 'Sri Lankan breakfast', description: 'String hoppers, dhal curry, coconut sambol and a fried egg', price: 1800, isVegetarian: false, isSpicy: true },
      { name: 'Egg hoppers', description: 'Crispy rice-flour bowls with a soft egg, served with lunu miris', price: 1200, isSpicy: true },
      { name: 'Tropical fruit platter', description: 'Papaya, pineapple, mango and passion fruit', price: 1000, isVegetarian: true },
      { name: 'Banana pancakes', description: 'With kithul treacle and grated coconut', price: 1100, isVegetarian: true },
      { name: 'Eggs your way', description: 'Omelette, scrambled or fried, with toast and grilled tomato', price: 1300, isVegetarian: true },
      { name: 'Ceylon tea or coffee', description: 'Freshly brewed, refilled as you like', price: null, isVegetarian: true },
    ],
  },
  {
    key: 'LUNCH',
    title: 'Lunch',
    tagline: 'Home-style Sri Lankan cooking',
    hours: '12:00 – 3:00 pm',
    description: 'Light lunches and generous rice and curry, cooked the way our families make it. Eat in the shade of the palms or have it brought to your room.',
    imageUrl: '/images/hero-4.jpg',
    items: [
      { name: 'Rice and curry', description: 'Red rice with five vegetable curries, papadam and sambol', price: 2200, isVegetarian: true, isSpicy: true },
      { name: 'Devilled prawns', description: 'Wok-fried with peppers, onion and a sweet-chilli glaze', price: 3400, isSpicy: true },
      { name: 'Chicken kottu roti', description: 'Chopped roti with vegetables, egg and curry gravy', price: 2000, isSpicy: true },
      { name: 'Seafood grill', description: 'Squid, prawns and fish of the day with garlic butter and salad', price: 4200 },
      { name: 'Tuna salad', description: 'Seared yellowfin, greens, avocado and lime dressing', price: 2600 },
    ],
  },
  {
    key: 'DINNER',
    title: 'Dinner',
    tagline: 'Fresh catch under the stars',
    hours: '7:00 – 10:00 pm',
    description: 'Every evening the kitchen cooks what came in at Mirissa harbour that morning. Candlelit tables on the beach can be arranged for special nights.',
    imageUrl: '/images/hero-5.jpg',
    items: [
      { name: 'Catch of the day', description: 'Grilled or in a coconut curry, with rice and vegetables', price: 4800 },
      { name: 'Jaffna crab curry', description: 'Lagoon crab slow-cooked in roasted spices', price: 5500, isSpicy: true },
      { name: 'Lamprais', description: 'Rice and meat curries baked in a banana leaf', price: 3200, isSpicy: true },
      { name: 'Beach BBQ platter for two', description: 'Lobster tail, prawns, fish and chicken from the grill', price: 12500 },
      { name: 'Vegetable thali', description: 'Seasonal curries, dhal, rice and roti', price: 2600, isVegetarian: true },
      { name: 'Watalappan', description: 'Coconut and jaggery custard with cashews', price: 900, isVegetarian: true },
    ],
  },
];

async function seedMeals() {
  let created = 0;
  for (const { items, ...meal } of MEALS) {
    if (await prisma.mealService.findUnique({ where: { key: meal.key } })) continue;
    await prisma.mealService.create({
      data: { ...meal, items: { create: items.map((item, position) => ({ isVegetarian: false, isSpicy: false, ...item, position })) } },
    });
    created++;
  }
  console.log(`Meals: ${created} added, ${MEALS.length - created} already there`);
}

// Special dinners guests can ask for. Prices are made up; the photos are site placeholders.
const EXPERIENCES = [
  { title: 'Candlelit beach dinner', description: 'A private table on the sand with lanterns, a four-course menu from our kitchen and the sound of the waves. Perfect for honeymoons and anniversaries.', price: 18000, priceUnit: 'PER_COUPLE', duration: 'About 2 hours', imageUrl: '/images/hero-1.jpg' },
  { title: 'Beach BBQ night', description: 'Fresh fish, prawns and chicken from the grill, with salads, rice and a bonfire on the beach. Ask us which evenings it runs.', price: 7500, priceUnit: 'PER_PERSON', duration: 'Evening', imageUrl: '/images/hero-3.jpg' },
  { title: 'Sri Lankan cooking class', description: 'Visit the market with our cook, then make three curries, coconut sambol and roti together, and enjoy what you cooked for lunch.', price: 6000, priceUnit: 'PER_PERSON', duration: 'About 3 hours', imageUrl: '/images/hero-4.jpg' },
];

async function seedExperiences() {
  let created = 0;
  for (const [position, experience] of EXPERIENCES.entries()) {
    if (await prisma.diningExperience.findFirst({ where: { title: experience.title } })) continue;
    await prisma.diningExperience.create({ data: { ...experience, position } });
    created++;
  }
  console.log(`Special dinners: ${created} added, ${EXPERIENCES.length - created} already there`);
}

// Things to do around Mirissa. Prices are made up; photos are site placeholders.
const ACTIVITIES = [
  { title: 'Whale & dolphin watching', category: 'OCEAN', description: 'Head out from Mirissa harbour at sunrise to see blue whales, sperm whales and spinner dolphins in their own waters, with breakfast on board.', highlights: ['Blue whales from November to April', 'Breakfast and water on board', 'Hotel pick-up from the harbour'], price: 16000, priceUnit: 'PER_PERSON', duration: 'About 4 hours', bestTime: '6:30 am departure', imageUrl: '/images/hero-2.jpg' },
  { title: 'Snorkelling with turtles', category: 'OCEAN', description: 'Swim in calm, clear water near the reef where green turtles come to feed. Masks, fins and a local guide are included.', highlights: ['Gear and guide included', 'Calm water, good for beginners', 'Ten minutes from the hotel'], price: 5500, priceUnit: 'PER_PERSON', duration: 'About 2 hours', bestTime: 'Morning, when the sea is calm', imageUrl: '/images/hero-4.jpg' },
  { title: 'Surf lesson', category: 'ADVENTURE', description: 'Learn to stand up on gentle beach breaks with a patient local instructor. Boards and rash vests are provided.', highlights: ['Board and rash vest included', 'Small groups', 'All levels welcome'], price: 7000, priceUnit: 'PER_PERSON', duration: '2 hours', bestTime: 'Early morning or late afternoon', imageUrl: '/images/hero-1.jpg' },
  { title: 'Coconut Tree Hill sunset walk', category: 'ADVENTURE', description: 'A short walk along the coast to the famous palm-covered hill for the best sunset view in Mirissa, with a fresh king coconut on the way.', highlights: ['King coconut included', 'Easy walk', 'Great photo spot'], price: 3000, priceUnit: 'PER_PERSON', duration: 'About 1.5 hours', bestTime: '5:00 pm start', imageUrl: '/images/hero-3.jpg' },
  { title: 'Galle Fort day trip', category: 'CULTURE', description: 'Explore the 17th-century Dutch fort in Galle: ramparts, the lighthouse, cafés and small shops, with a driver and time to wander.', highlights: ['Private car and driver', 'UNESCO World Heritage site', 'Stop at the stilt fishermen'], price: 18000, priceUnit: 'PER_GROUP', duration: 'Half day', bestTime: '9:00 am start', imageUrl: '/images/hero-5.jpg' },
  { title: 'Ayurvedic spa ritual', category: 'WELLNESS', description: 'A traditional Sri Lankan treatment with warm herbal oils, a full-body massage and a herbal steam to finish. Pure relaxation after a day in the sun.', highlights: ['Herbal oils and steam', 'Trained therapists', 'Herbal tea afterwards'], price: 9500, priceUnit: 'PER_PERSON', duration: '90 minutes', bestTime: 'Any afternoon', imageUrl: '/images/auth-beach-2.jpg' },
];

async function seedActivities() {
  let created = 0;
  for (const [position, activity] of ACTIVITIES.entries()) {
    if (await prisma.experience.findFirst({ where: { title: activity.title } })) continue;
    await prisma.experience.create({ data: { ...activity, position } });
    created++;
  }
  console.log(`Experiences: ${created} added, ${ACTIVITIES.length - created} already there`);
}

async function main() {
  const featureIds = await seedAmenities(prisma.feature, FEATURES, 'Features');
  const facilityIds = await seedAmenities(prisma.facility, FACILITIES, 'Facilities');

  let created = 0;
  for (const { images, features, facilities, ...room } of ROOMS) {
    const existing = await prisma.room.findFirst({ where: { name: room.name } });
    if (existing) {
      // Rooms from before room numbers existed get the sample numbers, as long as the admin has not set their own.
      if (existing.roomNumbers.length === 0) {
        await prisma.room.update({ where: { id: existing.id }, data: { roomNumbers: room.roomNumbers, quantity: room.roomNumbers.length } });
      }
      continue;
    }

    await prisma.room.create({
      data: {
        ...room,
        capacity: room.maxAdults + room.maxChildren,
        // Sample photos on the hotel's Cloudinary account. No publicId: deleting a sample room leaves the shared photo in place.
        images: { create: images.map((file, position) => ({ url: `${SAMPLE_PHOTOS}${file}`, position })) },
        features: { create: features.map((name) => ({ featureId: featureIds.get(name) })) },
        facilities: { create: facilities.map((name) => ({ facilityId: facilityIds.get(name) })) },
      },
    });
    created++;
  }

  console.log(`Rooms: ${created} added, ${ROOMS.length - created} already there`);

  await seedBookings();
  await seedMessages();
  await seedMeals();
  await seedExperiences();
  await seedActivities();

  // Bookings marked paid before payments were recorded as an amount count as paid in full.
  const paid = await prisma.booking.findMany({ where: { paymentStatus: 'PAID', amountPaid: 0 }, select: { id: true, totalAmount: true } });
  for (const booking of paid) await prisma.booking.update({ where: { id: booking.id }, data: { amountPaid: booking.totalAmount } });
  if (paid.length) console.log(`Payments: ${paid.length} paid booking(s) given their paid amount`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
