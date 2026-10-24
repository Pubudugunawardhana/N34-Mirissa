<div align="center">

<img src="public/images/hero-1.jpg" alt="Mirissa beach" width="100%" />

# 🌊 N34 Mirissa

### *Where the Ocean Meets Calm*

The website, booking system and staff admin panel for **N34 Mirissa**, a boutique beach hotel on the south coast of Sri Lanka.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/Neon-Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-photos-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)

[✨ Features](#-what-it-does) · [🚀 Quick start](#-quick-start) · [🔐 Environment](#-environment-variables) · [🧭 How it works](#-how-it-works) · [☁️ Deploy](#%EF%B8%8F-deployment)

</div>

---

## ✨ What it does

<table>
<tr>
<td width="50%" valign="top">

### 🏝️ For guests

- 🛏️ **Rooms:** filter by dates, guests and facilities, with live availability ("2 rooms left")
- 📅 **Online booking:** pick a meal plan and choose your dish for each meal, with a live price quote
- 🔎 **Find my booking:** look up a booking by reference and email
- 🍛 **Dining:** breakfast, lunch and dinner menus, room service, special dinners and a gallery
- 🐋 **Experiences:** whale watching, surf, tours and more, requested for a date
- 📍 **Contact:** a Google map, **Get directions**, and nearby places with distances
- 👤 **Accounts:** sign-up, email verification, password reset and a profile photo
- 🌙 **Dark mode**, and a layout that works on phones

</td>
<td width="50%" valign="top">

### 🧑‍💼 For staff (`/admin`)

- 📥 **New bookings:** confirm a booking and assign a free room number
- 📚 **Booking records:** Upcoming / Past stays / Cancelled
- 💳 **Mark paid:** asks first, emails a receipt, then opens it to print
- ➕ **Update booking:** change the room or meals, or add extras to the bill
- 🚶 **Walk-in booking:** book a guest at the front desk
- 🗓️ **Room availability:** every room number, free or booked
- 🍽️ **Content:** rooms, dining and experiences, with photo uploads
- ✉️ **Messages:** one inbox for contact and request forms, with email replies
- ⚙️ **Site settings:** contacts, social links, map pin, **pause booking**, **maintenance mode**

</td>
</tr>
</table>

---

## 🚀 Quick start

> **You need** Node.js 20+ and a PostgreSQL database. A free [Neon](https://neon.tech) database works great.

```bash
npm install            # 1. install dependencies
# 2. create .env (see "Environment variables" below)
npx prisma db push     # 3. create the database tables
npm run seed           # 4. sample rooms, menus and experiences (safe to re-run)
npm run dev            # 5. open http://localhost:3000
```

### 🔑 First admin login

If no admin exists yet, signing in at **`/admin-login`** creates one:

| Username | Password |
| :---: | :---: |
| `admin` | `admin` |

> [!WARNING]
> **Change this password before going live.** Sign in, open **Account** (`/user`) and use the password form. The default values are public in `src/lib/users.ts`.

---

## 🔐 Environment variables

Create a `.env` file in the project root. **Never commit it.**

| Variable | | Purpose |
| --- | :---: | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Signs sessions. Generate one with `npx auth secret` |
| `APP_URL` | ⭐ | The public address, used for links in emails |
| `REQUIRE_EMAIL_VERIFICATION` | ➖ | `true` = new guests must verify their email |
| `GMAIL_USER` · `GMAIL_APP_PASSWORD` | ➖ | Sends emails through Gmail ([app password](https://support.google.com/accounts/answer/185833)) |
| `CLOUDINARY_CLOUD_NAME` · `_API_KEY` · `_API_SECRET` | ➖ | Stores uploaded photos on Cloudinary |

<sub>✅ required · ⭐ recommended · ➖ optional</sub>

> [!TIP]
> **Works without the extras.** Without Gmail, emails are printed in the terminal. Without Cloudinary, photos are saved in `public/uploads/`. That's fine for development, but use Cloudinary when you deploy.

<details>
<summary><b>📄 Example <code>.env</code></b></summary>

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

</details>

---

## 🛠️ Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | 🔥 Start the dev server |
| `npm run build` · `npm start` | 📦 Build and run for production |
| `npm run lint` | 🧹 Run ESLint |
| `npm run seed` | 🌱 Add sample content (safe to re-run) |
| `npm run photos:to-cloud` | ☁️ Move photos stored in the project to Cloudinary (add `-- --dry` to preview) |
| `npx prisma db push` | 🗄️ Apply `schema.prisma` changes to the database |
| `npx prisma studio` | 👀 Browse the database in the browser |
| `npx tsc --noEmit` | ✅ Type-check the project |

> [!NOTE]
> The project uses `prisma db push`, so there are no migration files. After changing the schema, run it and then restart the dev server.

---

## 🧭 How it works

### 📅 The life of a booking

```mermaid
flowchart LR
    A([🧳 Guest books online]) --> B[⏳ Pending]
    W([🚶 Walk-in at the desk]) --> C
    B -->|Staff assign a room| C[✅ Confirmed]
    B -->|Cancelled| X[❌ Cancelled]
    C -->|Mark paid| D[💳 Paid + receipt emailed]
    C -->|Guest or staff cancel| X
```

Every booking that isn't cancelled holds a room from check-in to check-out. The check-out day is free again.

### 💰 Pricing

```text
Total = room price × nights
      + meal plan per guest per night × guests × nights
      + extras (laundry, transfers, …)
```

- **Meals:** the meal plan price is split evenly across its meals. A chosen dish's own price replaces that meal's share.
- **Extras:** they're listed separately on the bill.
- **Currency:** all prices are in **Sri Lankan rupees (LKR)**.

### 🎛️ Site switches

| Switch | What visitors see |
| --- | --- |
| ⏸️ **Pause online booking** | The site stays open, but the booking forms are replaced by a "call or WhatsApp us" message |
| 🚧 **Maintenance mode** | A "We'll be back soon" page. Admins can still use everything |

### 📍 The map
Paste coordinates or a full Google Maps link into **Site settings → Map location**. The map is Google's free embed, so no API key is needed. Without a pin, it searches for the saved address.

### 🌙 Dark mode
Components use light-mode classes, and `globals.css` restyles them under `<html data-theme="dark">`. Sections that are always dark carry `theme-fixed`.

<details>
<summary><b>🗂️ Project structure</b></summary>

```text
prisma/
├─ schema.prisma            Database models
├─ seed.mjs                 Sample content
└─ move-photos-to-cloudinary.mjs
public/images/              Site photos (hero, sign-in)
src/
├─ app/                     Pages and routes (App Router)
│  ├─ page.tsx              Home
│  ├─ rooms/ book/ dining/ experiences/ contact/ user/
│  ├─ admin/                Admin panel
│  ├─ actions/              Server Actions
│  └─ maintenance/          Shown during maintenance mode
├─ components/              UI building blocks
├─ lib/
│  ├─ booking.ts            Prices, meal plans, date rules
│  ├─ booking-bill.ts       Recalculates a bill
│  ├─ availability.ts       Rooms booked per date range
│  ├─ hotel.ts              Site settings with defaults
│  ├─ map.ts                Map pin, Google Maps links, distances
│  ├─ mail.ts               Email templates and sending
│  └─ uploads.ts            Photo uploads (Cloudinary or local)
├─ auth.ts · auth.config.ts NextAuth and route protection
└─ proxy.ts                 Auth and maintenance check on every request
```

</details>

<details>
<summary><b>🧱 Tech stack</b></summary>

| Area | Choice |
| --- | --- |
| Framework | Next.js 16: App Router, Server Components, Server Actions, Turbopack |
| UI | React 19, Tailwind CSS v4, Poppins |
| Database | PostgreSQL (Neon) via Prisma 5 |
| Auth | NextAuth v5 (credentials), bcrypt |
| Validation | Zod 4 |
| Email | Nodemailer + Gmail |
| Photos | Cloudinary (local fallback) |

> This Next.js version has breaking changes from older releases. Check the guides in `node_modules/next/dist/docs/` before changing framework-level code.

</details>

---

## ☁️ Deployment

Runs on any Node.js host that supports Next.js, for example [Vercel](https://vercel.com).

- [ ] Add the environment variables, with `APP_URL` set to the live address
- [ ] Set up **Cloudinary** for photos (local uploads aren't kept between deploys)
- [ ] Run `npx prisma db push` once against the production database
- [ ] Build with `npm run build`, start with `npm start` (or let the host do it)
- [ ] Sign in at `/admin-login` and **change the default admin password**
- [ ] Fill in **Site settings**: contacts, social links, map location

---

<div align="center">

**Made with 🌴 for the south coast of Sri Lanka**

© N34 Mirissa · All rights reserved

</div>
