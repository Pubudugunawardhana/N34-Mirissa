# N34 Mirissa

The website and booking system for **N34 Mirissa**, a boutique beach hotel in Mirissa, Sri Lanka. Guests use it to browse rooms, book a stay, choose their meals and request experiences. Hotel staff use the admin panel for bookings, rooms, dining, messages and site settings.

Built with **Next.js 16** (App Router), **React 19**, **Prisma** on **PostgreSQL**, **NextAuth v5** and **Tailwind CSS v4**.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How things work](#how-things-work)
- [Deployment](#deployment)

---

## Features

### For guests

| Page | What it does |
| --- | --- |
| **Home** (`/`) | A full-screen photo hero with a date search bar. Below it: featured rooms, the dining band, experiences, facilities, a gallery, an FAQ and a closing booking call to action. |
| **Rooms** (`/rooms`) | Rooms filtered by dates, guests and facilities, with live availability ("2 rooms left"). |
| **Room details** (`/rooms/[id]`) | Photos, facilities and prices for one room. |
| **Booking** (`/book`) | Dates, guests and a meal plan, with one dish per included meal picked from the menu. Shows a live price quote. |
| **Confirmation and lookup** (`/book/confirmation/[id]`, `/book/find`) | A booking summary, and a way to find a booking by reference and email. |
| **Dining** (`/dining`) | Breakfast, lunch and dinner menus in sliders, room service, special dinners with a request form, and a photo gallery. |
| **Experiences** (`/experiences`) | Whale watching, surfing, tours and more. Filter by category, then send a request for a date. |
| **Contact** (`/contact`) | Contact details, a Google map with directions and nearby places, and a message form. |
| **Account** (`/user`) | The guest's own bookings and profile. Sign-up has optional email verification. |

### For staff (admin panel, `/admin`)

| Section | What it does |
| --- | --- |
| **Dashboard** | Today at a glance and the most recent bookings. |
| **New bookings** | Confirm or cancel requests, and assign a room number. The room list shows which numbers are free. |
| **Booking records** | Upcoming, past and cancelled stays. Mark a booking paid (the guest gets a "Payment received" email). Update rooms, meals and extra charges, and print a receipt. |
| **Walk-in booking** | Book a guest at the front desk. |
| **Room availability** | Every room number, free or booked, for any date. |
| **Rooms management** | Rooms, prices, photos, room numbers, features and facilities. |
| **Dining** | Meal times, menus and dish prices, room service, special dinners and the gallery. |
| **Experiences** | Add, edit, reorder and hide experiences. The price is optional; without one, guests see no Request button. |
| **Messages** | The Contact form, dining requests and experience requests in one inbox. Replies go out by email. |
| **Site settings** | Contact details and social links, the map location, pausing online booking, and maintenance mode. |

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Turbopack) |
| UI | React 19, Tailwind CSS v4, Poppins font |
| Database | PostgreSQL (e.g. Neon) via Prisma 5 |
| Auth | NextAuth v5 (credentials), bcrypt password hashes |
| Validation | Zod 4 |
| Email | Nodemailer with Gmail (logged to the console when not configured) |
| Images | Cloudinary, or local files in `public/uploads` when not configured |

> **Note:** This Next.js version has breaking changes from older releases. Before changing framework-level code, read the guides in `node_modules/next/dist/docs/` (see `AGENTS.md`).

---

## Getting started

### Requirements

- Node.js 20 or newer
- A PostgreSQL database (a free [Neon](https://neon.tech) database works well)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file (see the next section) and fill it in
#    .env

# 3. Create the database tables
npx prisma db push

# 4. Add sample content: room numbers, menus, experiences and messages (safe to run more than once)
npm run seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First admin login

If no admin account exists, signing in at `/admin-login` creates a default one:

| Username | Password |
| --- | --- |
| `admin` | `admin` |

> ⚠️ **Change this password before the site goes live**: sign in, open the Account page (`/user`) and use the password form. The default values are public in the code (`src/lib/users.ts`).

---

## Environment variables

Create a `.env` file in the project root. **Never commit it.**

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string. |
| `AUTH_SECRET` | ✅ | Secret for signing sessions. Generate one with `npx auth secret`. |
| `APP_URL` | Recommended | The public site address, used for links in emails. Defaults to `http://localhost:3000`. |
| `REQUIRE_EMAIL_VERIFICATION` | Optional | Set to `true` to make new guests verify their email before signing in. |
| `GMAIL_USER` | Optional | The Gmail address emails are sent from. |
| `GMAIL_APP_PASSWORD` | Optional | A Gmail [app password](https://support.google.com/accounts/answer/185833) for that address. |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary account for photo uploads. |
| `CLOUDINARY_API_KEY` | Optional | 〃 |
| `CLOUDINARY_API_SECRET` | Optional | 〃 |

**Without Gmail settings**, emails (booking received, payment received, replies) are printed in the terminal instead of sent. **Without Cloudinary settings**, uploaded photos are saved under `public/uploads/`. That is fine for development, but on hosts with a temporary file system (such as Vercel), use Cloudinary.

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-string"
APP_URL="http://localhost:3000"
REQUIRE_EMAIL_VERIFICATION="false"
GMAIL_USER=""
GMAIL_APP_PASSWORD=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Build for production. |
| `npm start` | Run the production build. |
| `npm run lint` | Run ESLint. |
| `npm run seed` | Add sample content (`prisma/seed.mjs`). Safe to run more than once. |
| `npx prisma db push` | Apply changes in `prisma/schema.prisma` to the database. |
| `npx prisma studio` | Browse the database in your browser. |
| `npx tsc --noEmit` | Type-check the project. |

> The project uses `prisma db push` (no migration files). After changing the schema, run `npx prisma db push` and restart the dev server so it picks up the new Prisma client.

---

## Project structure

```text
prisma/
  schema.prisma        Database models
  seed.mjs             Sample content
public/images/         Site photos (hero and placeholders)
src/
  app/                 Pages and routes (App Router)
    page.tsx           Home
    rooms/  book/  dining/  experiences/  contact/  user/
    admin/             Admin panel (bookings, rooms, dining, messages, settings, …)
    actions/           Server Actions (booking, admin changes, contact, requests)
    maintenance/       Shown to visitors while maintenance mode is on
  components/          UI pieces (booking form, sliders, admin forms, nav, footer, …)
  lib/                 Shared logic
    booking.ts         Prices, meal plans, date checks, LKR formatting
    booking-bill.ts    Recalculates a booking's bill (room, meals, extras)
    availability.ts    Booked rooms per date range
    hotel.ts           Site settings with sensible defaults
    map.ts             Map pin parsing, Google Maps links, nearby distances
    mail.ts            Email templates and sending
    uploads.ts         Photo uploads (Cloudinary or local)
  auth.ts, auth.config.ts   NextAuth setup and route protection
  proxy.ts             Runs auth and maintenance checks on every request
```

---

## How things work

**Booking flow.**
1. A guest picks dates, guests and a meal plan, and the booking is saved as *pending*.
2. Staff confirm it and assign a room number.
3. When payment is marked, the guest is emailed a receipt.

Every booking that is not cancelled holds a room unit from check-in to check-out (the check-out day is free again).

**Pricing.**
- A stay costs the room price × nights, plus meals.
- The meal plan price is split evenly across the meals it includes. When a guest picks a dish, that dish's price replaces its share.
- Extra charges added later (laundry, transfers, …) are listed separately on the bill.

**Site switches.**
- **Pause online booking:** guests can still browse, but see a message with the phone number and WhatsApp instead of the booking form.
- **Maintenance mode:** visitors see a maintenance page, while admins can still use the whole site.

**Map.** Paste coordinates or a full Google Maps link into *Site settings → Map location*. The Contact page uses Google's free embedded map, so no API key is needed. Until a location is saved, the map searches for the address.

**Dark mode.** Components are written with light-mode classes. `globals.css` restyles them when `<html data-theme="dark">` is set. Sections that are always dark (photo heroes, the footer) carry the class `theme-fixed`.

**Prices** are in Sri Lankan rupees (LKR).

---

## Deployment

The app runs on any Node.js host that supports Next.js, such as [Vercel](https://vercel.com).

1. Add the environment variables from above to your host. Set `APP_URL` to the live address.
2. Use Cloudinary for photos (the local `public/uploads` folder is not kept between deploys on most hosts).
3. Run `npx prisma db push` against the production database once.
4. Build with `npm run build` and start with `npm start`, or let your host do it.
5. Sign in to `/admin-login` and **change the default admin password** on the Account page (`/user`). Then fill in *Site settings* (contact details, social links, map location).

---

© N34 Mirissa. All rights reserved.
