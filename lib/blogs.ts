// Blog data - In a real app this would come from a CMS or MDX files
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  readTime: string;
  date: string;
  author: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'irctc-tatkal-booking-tips',
    title: 'How to Book Tatkal Tickets on IRCTC: Complete Guide 2024',
    tag: 'Tips',
    excerpt: 'Step-by-step guide to successfully book Tatkal tickets during peak hours with higher success rate.',
    readTime: '5 min read',
    date: '2024-12-15',
    author: 'Live Train Station Team',
    content: `
## What is Tatkal Booking?

Tatkal is a special quota scheme introduced by Indian Railways that allows passengers to book tickets at a premium price up to **1 day before the departure date** (excluding the day of departure).

- **AC classes**: Opens at **10:00 AM** for Tatkal quota
- **Non-AC classes**: Opens at **11:00 AM** for Tatkal quota

## Tatkal Quota Charges

| Class | Min Charge | Max Charge |
|-------|-----------|------------|
| 2S    | ₹10       | ₹15        |
| SL    | ₹100      | ₹200       |
| CC    | ₹125      | ₹225       |
| EC/3A/2A/1A | ₹300-₹600 | varies |

## Step-by-Step Guide

### 1. Prepare in Advance
- Create your IRCTC account beforehand
- Save passenger details in your profile
- Have your payment method ready (UPI recommended for speed)

### 2. Login Early
- Login at least **5 minutes before** the booking window opens
- Keep the IRCTC website tab open and refresh it

### 3. Quick Booking Flow
1. Go to **Plan My Journey**
2. Select your stations and date
3. Click **Search** before the window opens
4. When window opens, select **Tatkal** quota
5. Choose your class and train
6. Fill passenger details (use saved passengers)
7. Pay immediately — UPI is fastest

## Pro Tips 🚀

- **Use IRCTC Rail Connect app** — it's often faster than the website
- **Book on a desktop** for better performance
- **Avoid peak season** dates if possible — Tatkal sells out in seconds
- **Use a fast internet connection** — mobile data can be unreliable
- **Keep OTP phone nearby** for payment authentication
- If your first choice train shows "Tatkal WL", try the next available train

## Common Mistakes to Avoid

❌ Logging in at the exact opening time (too late)  
❌ Using slow payment methods like Net Banking  
❌ Not having passenger details saved  
❌ Choosing unavailable trains without checking alternatives  

## Using Live Train Station for Tatkal

Before booking, use **Live Train Station's Live Status** to check which trains are running on time. Book Tatkal on punctual trains for the best experience!
    `,
  },
  {
    slug: 'understanding-pnr-status',
    title: 'Understanding PNR Status: CNF, RAC, WL Explained Simply',
    tag: 'Guide',
    excerpt: 'What do CNF, RAC, WL, GNWL, PQWL mean? A plain-language explanation for every traveller.',
    readTime: '4 min read',
    date: '2024-12-10',
    author: 'Live Train Station Team',
    content: `
## What is PNR?

PNR stands for **Passenger Name Record** — a unique 10-digit number assigned to your railway booking. You can use it to track your booking status, which changes as the journey date approaches.

## Status Codes Explained

### ✅ CNF — Confirmed
Your ticket is **confirmed**. You have a reserved seat/berth. Your coach number and berth number will be assigned.

### 🟡 RAC — Reservation Against Cancellation
You are in **RAC status**. This means:
- You ARE guaranteed a seat on the train
- But you share a side-lower berth with another RAC passenger
- If someone cancels, you get a full berth
- RAC passengers must board the train

### 🔴 WL — Waitlist
You are on the **waitlist**. This means:
- You do NOT have a confirmed seat yet
- If confirmed passengers cancel, waitlist moves up
- Check your status before the journey date

## Types of Waitlist

| Code | Full Form | Meaning |
|------|-----------|---------|
| GNWL | General Waitlist | Normal waitlist — best chance of confirmation |
| PQWL | Pooled Quota Waitlist | Between intermediate stations — harder to confirm |
| RLWL | Remote Location WL | Specific to origin station |
| TQWL | Tatkal WL | Tatkal quota waitlist — rarely confirms |
| RSWL | Road-side WL | Rarely confirms |

## When Does WL Confirm?

Waitlist confirmation depends on:
1. **Cancellations** before chart preparation (usually 4 hours before departure)
2. **WL position** — lower number = higher priority
3. **Quota availability** — some quotas release closer to departure

### Chart Preparation
Charts are usually prepared **3-4 hours before departure**. If you're still on WL after chart preparation, your ticket is **auto-cancelled** and a refund is processed.

## Refund on WL Cancellation

| Status at Cancellation | Refund |
|------------------------|--------|
| Before Chart Preparation | Full refund minus small charges |
| After Chart — WL ticket | Auto-cancelled, full refund |
| CNF cancelled before departure | Partial refund |
| RAC/CNF after departure | No refund |

## Using Live Train Station PNR Check

Simply enter your 10-digit PNR on our **PNR Status page** to see:
- Current status of each passenger
- Train and journey details
- Chart preparation status
- Boarding point information
    `,
  },
  {
    slug: 'best-train-routes-india',
    title: 'Top 10 Scenic Train Routes in India You Must Experience',
    tag: 'Travel',
    excerpt: "From the Konkan Railway to Darjeeling Himalayan Railway, discover India's most breathtaking rail journeys.",
    readTime: '7 min read',
    date: '2024-12-05',
    author: 'Live Train Station Team',
    content: `
## India's Most Beautiful Train Journeys

India's vast railway network spans over 67,000 km, passing through deserts, mountains, coastlines, and jungles. Here are the most spectacular routes you should experience at least once.

## 1. 🏔️ Darjeeling Himalayan Railway (Toy Train)
**Route**: New Jalpaiguri → Darjeeling  
**Distance**: 88 km | **Duration**: 7-8 hours  
**Best Time**: October to December, March to May

A UNESCO World Heritage site, this narrow-gauge toy train winds through tea plantations and Himalayan foothills at just 25-30 km/h. The views of the Kanchenjunga are breathtaking on clear days.

## 2. 🌊 Konkan Railway
**Route**: Mumbai (CSMT) → Goa/Mangalore  
**Trains**: Jan Shatabdi, Konkan Kanya, Mandovi Express  
**Best Time**: July to September (monsoon magic)

Often called the most scenic route in India, the Konkan Railway passes through 2,000 bridges, 92 tunnels, and coastal landscapes of Maharashtra, Goa, and Karnataka.

## 3. 🏜️ Palace on Wheels
**Route**: Delhi → Rajasthan (Circular)  
**Duration**: 8 days | **Type**: Luxury heritage train

Experience royal Rajasthan aboard this iconic luxury train visiting Jaipur, Jaisalmer, Jodhpur, Ranthambore, Agra, and more.

## 4. 🌿 Nilgiri Mountain Railway (Blue Mountain)
**Route**: Mettupalayam → Ooty  
**Distance**: 46 km | **Duration**: 5 hours  
**UNESCO Heritage Site**

This rack-and-pinion railway climbs 2,200 meters through dense forests, tea estates, and tunnels in the Nilgiri Hills.

## 5. ❄️ Kalka-Shimla Railway
**Route**: Kalka → Shimla  
**Distance**: 96 km | **Duration**: 5-6 hours  
**UNESCO Heritage Site**

Known as the "Queen of Hill Railways," this narrow-gauge train passes through 102 tunnels and 864 bridges through the Shivalik Hills.

## 6. 🏖️ Vivek Express (Longest Route)
**Route**: Dibrugarh (Assam) → Kanyakumari (Tamil Nadu)  
**Distance**: 4,286 km | **Duration**: 82+ hours

The longest train journey in India covers the entire length of the country, from the northeastern tip to the southern tip.

## 7. 🦁 Ranthambore Route
**Route**: Delhi → Sawai Madhopur (Rajasthan Express)  
**Best**: Night train, arrive at dawn for tiger safaris

## 8. 🌾 Varanasi Ghats Route
**Route**: Allahabad → Varanasi  
**Experience**: Arrive at dawn, watch Ganga Aarti from the ghats

## 9. 🏔️ Jammu to Srinagar (Banihal Tunnel)
The new Banihal-Banihal tunnel section is an engineering marvel through the Pir Panjal range.

## 10. 🌴 Kerala Backwaters Route
**Route**: Thiruvananthapuram → Kozhikode (Parasuram Express)  
Beautiful Kerala coastline views with glimpses of backwaters, coconut groves, and beaches.

## Tips for Scenic Journeys

- **Book window seats** — Upper berths (Window side) on these trains give the best views
- **Travel during daylight** when possible for maximum scenery
- **Carry binoculars** for wildlife routes
- **Check weather** before booking mountain routes
- **Use Live Train Station** to track your train in real-time and plan your journey perfectly!
    `,
  },
  {
    slug: 'indian-railway-classes-guide',
    title: 'Complete Guide to Indian Railway Classes: 1A, 2A, 3A, SL, CC',
    tag: 'Guide',
    excerpt: 'Confused about train classes? Here\'s everything you need to know about all railway classes, their features and when to book them.',
    readTime: '6 min read',
    date: '2024-11-28',
    author: 'Live Train Station Team',
    content: `
## Indian Railway Classes Explained

Indian Railways offers multiple travel classes to suit every budget and comfort level. Here's a complete breakdown.

## Air-Conditioned Classes

### 1A — First Class AC
- **Berths per coupe**: 2 or 4 berths per coupe
- **Features**: Private coupe, curtains, bedding provided, charging points
- **Best for**: Maximum privacy and comfort
- **Fare**: Most expensive (3-4x Sleeper)

### 2A — Second Class AC (2-tier)
- **Berths per bay**: 4 berths (2 lower, 2 upper)
- **Features**: Side upper/lower included, curtains, bedding, charging
- **Best for**: Long journeys with good privacy
- **Fare**: Very comfortable for overnight journeys

### 3A — Third Class AC (3-tier)
- **Berths per bay**: 6 berths (upper/middle/lower) + 2 side berths
- **Features**: Bedding provided, charging, no curtains
- **Best for**: Long-distance budget AC travel — MOST POPULAR
- **Fare**: Moderate

### CC — Chair Car (AC)
- **Seats**: Reclining chair seats (no sleeping berths)
- **Best for**: Day travel on Shatabdi/Jan Shatabdi trains
- **Fare**: Comparable to bus travel, but faster

### EC — Executive Chair Car
- **Seats**: Wide, premium reclining seats
- **Best for**: Rajdhani/Vande Bharat premium experience

## Non-Air-Conditioned Classes

### SL — Sleeper Class
- **Berths per bay**: 6 berths + 2 side berths
- **Features**: Open sections, fans, no AC
- **Best for**: Budget overnight travel, short routes
- **Fare**: Budget-friendly (most booked class)

### 2S — Second Sitting
- **Seats**: Hard bench seats
- **Best for**: Very short journeys (2-4 hours)
- **Fare**: Cheapest reserved class

### GEN — General / Unreserved
- **Type**: Unreserved — board without seat guarantee
- **Best for**: Very short trips or emergency travel

## Comparison Table

| Class | AC | Berths | Bedding | Privacy | Price |
|-------|----|--------|---------|---------|-------|
| 1A    | ✅ | 2-4    | ✅ | High | ₹₹₹₹ |
| 2A    | ✅ | 4+2    | ✅ | Medium | ₹₹₹ |
| 3A    | ✅ | 6+2    | ✅ | Low | ₹₹ |
| CC    | ✅ | Chair  | ❌ | Low | ₹₹ |
| SL    | ❌ | 6+2    | ❌ | Low | ₹ |
| 2S    | ❌ | Chair  | ❌ | None | ₹ |

## Which Class Should You Choose?

- **Overnight + Comfort**: 2A or 3A
- **Budget overnight**: SL
- **Day journey**: CC (Shatabdi) or 2S
- **Maximum comfort**: 1A
- **Large group/family**: 3A (entire bay)

Use **Live Train Station's Fare Calculator** to compare prices across classes for your specific route and date!
    `,
  },
  {
    slug: 'railway-station-codes-india',
    title: 'Major Indian Railway Station Codes: Quick Reference Guide',
    tag: 'Reference',
    excerpt: 'Lost trying to find station codes? Here\'s a comprehensive list of major Indian railway station codes for quick reference.',
    readTime: '3 min read',
    date: '2024-11-20',
    author: 'Live Train Station Team',
    content: `
## Why Station Codes Matter

When searching for trains on platforms like Live Train Station or IRCTC, you often need to enter **station codes** — 2-5 letter abbreviations for each station. Here are the most important ones.

## Metro Cities

| City | Station | Code |
|------|---------|------|
| Delhi | New Delhi | NDLS |
| Delhi | Old Delhi | DLI |
| Delhi | Hazrat Nizamuddin | NZM |
| Mumbai | Chhatrapati Shivaji Terminus | CSMT |
| Mumbai | Mumbai Central | BCT |
| Mumbai | Bandra Terminus | BDTS |
| Mumbai | Lokmanya Tilak Terminus | LTT |
| Chennai | Chennai Central | MAS |
| Chennai | Chennai Egmore | MS |
| Kolkata | Howrah | HWH |
| Kolkata | Sealdah | SDAH |
| Bangalore | KSR Bengaluru City | SBC |
| Bangalore | Yesvantpur | YPR |
| Hyderabad | Secunderabad | SC |
| Hyderabad | Kacheguda | KCG |

## North India

| City | Station | Code |
|------|---------|------|
| Agra | Agra Cantt | AGC |
| Lucknow | Lucknow Charbagh | LKO |
| Varanasi | Varanasi Junction | BSB |
| Allahabad/Prayagraj | Prayagraj Junction | PRYJ |
| Jaipur | Jaipur Junction | JP |
| Jodhpur | Jodhpur Junction | JU |
| Amritsar | Amritsar Junction | ASR |
| Chandigarh | Chandigarh | CDG |

## South India

| City | Station | Code |
|------|---------|------|
| Coimbatore | Coimbatore Junction | CBE |
| Madurai | Madurai Junction | MDU |
| Thiruvananthapuram | Trivandrum Central | TVC |
| Kochi | Ernakulam Junction | ERS |
| Visakhapatnam | Visakhapatnam | VSKP |
| Vijayawada | Vijayawada Junction | BZA |

## East & Northeast India

| City | Station | Code |
|------|---------|------|
| Patna | Patna Junction | PNBE |
| Guwahati | Guwahati | GHY |
| Bhubaneswar | Bhubaneswar | BBS |
| Ranchi | Ranchi | RNC |
| Dhanbad | Dhanbad | DHN |

## West India

| City | Station | Code |
|------|---------|------|
| Ahmedabad | Ahmedabad Junction | ADI |
| Surat | Surat | ST |
| Vadodara | Vadodara Junction | BRC |
| Pune | Pune Junction | PUNE |
| Nagpur | Nagpur Junction | NGP |

## Tip: Finding Any Station Code

On **Live Train Station**, just type the city name in the search box and the station code will appear as a suggestion. You can also search by the full station name.
    `,
  },
  {
    slug: 'how-to-check-live-train-status',
    title: 'How to Check Live Train Running Status: All Methods',
    tag: 'Guide',
    excerpt: 'Multiple ways to check where your train is right now — website, app, SMS, and more.',
    readTime: '4 min read',
    date: '2024-11-15',
    author: 'Live Train Station Team',
    content: `
## Why Check Live Train Status?

Knowing your train's real-time position helps you:
- **Plan airport/station pickups** more accurately
- **Reduce waiting time** at stations
- **Make alternative plans** if the train is heavily delayed
- **Track a loved one's journey** for peace of mind

## Method 1: Live Train Station (Recommended)

The **fastest and most detailed** way to check live status:

1. Go to [Live Train Station Live Status](/live)
2. Enter your 5-digit train number
3. Select the journey date (or leave as today)
4. Click **Track Train**

You'll see:
- Current location between stations
- All stops with actual arrival/departure times
- Delay information at each station
- Platform numbers (where available)

## Method 2: NTES (National Train Enquiry System)

Visit **indianrail.gov.in** or **NTES portal**:
1. Select "Spot Your Train"
2. Enter train number or name
3. Select date

## Method 3: 139 Railway Enquiry (SMS/Call)

**SMS**: Send \`SPOT {TrainNumber} {Date}\` to **139**  
Example: \`SPOT 12301 15-12\` to 139

**Call**: Dial **139** and follow IVR instructions

## Method 4: IRCTC Rail Connect App

Download the official IRCTC Rail Connect app and use the "Train Running Status" feature.

## Method 5: Google

Simply search **"12301 train status"** on Google — it often shows live status directly in search results.

## Understanding the Status Display

When you check on Live Train Station, you'll see:

- 🟢 **Passed stations** — Train has already crossed these
- 🔵 **Current station** — Where the train is right now
- ⚪ **Upcoming stations** — Yet to be reached

### Delay Colors
- 🟢 **On time** or early
- 🟡 **1-15 minutes late**  
- 🔴 **More than 15 minutes late**

## Tips for Accuracy

- **Refresh frequently** — data updates every few minutes
- **Cross-reference** with the SMS system if Live Train Station shows old data
- For **very long distance trains** (like Vivek Express), data may have occasional gaps in remote areas
- **Festival seasons** often see heavier delays — plan accordingly
    `,
  },
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(p => p.slug === slug);
}
