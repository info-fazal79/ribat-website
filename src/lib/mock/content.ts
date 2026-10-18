/** Mock homepage content (will move to the Banner model / Settings). */

import type { CategorySlug } from "./catalog";

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  titleBn: string;
  body: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  art: CategorySlug;
  tone: { from: string; to: string; ink: string; text: "light" | "dark" };
};

export const heroSlides: HeroSlide[] = [
  {
    id: "eid",
    art: "panjabi",
    eyebrow: "The Eid Edit · 2026",
    title: "Quiet luxury for sacred moments.",
    titleBn: "পবিত্র মুহূর্তের জন্য নিঃশব্দ আভিজাত্য",
    body: "Raw silk panjabis and hand-embroidered cottons, finished in Dhaka by master tailors.",
    primary: { label: "Shop Panjabi", href: "/categories/panjabi" },
    secondary: { label: "Explore the Edit", href: "/products" },
    tone: { from: "#1f3b33", to: "#0b1a16", ink: "#d8c08a", text: "light" },
  },
  {
    id: "abaya",
    art: "abaya",
    eyebrow: "New Season · Abaya",
    title: "Drape that moves with grace.",
    titleBn: "শালীনতায় সৌন্দর্য",
    body: "Dubai Nida and Korean crepe abayas — fluid, breathable, made to be lived in.",
    primary: { label: "Shop Abaya", href: "/categories/abaya" },
    secondary: { label: "New Arrivals", href: "/products" },
    tone: { from: "#2b2420", to: "#120f0d", ink: "#cbb38a", text: "light" },
  },
  {
    id: "thobe",
    art: "thobe",
    eyebrow: "Essentials · Thobe",
    title: "The thobe, refined.",
    titleBn: "জুব্বা — নতুন রূপে",
    body: "Emirati and Moroccan cuts in wrinkle-resistant Japanese fabric. Free delivery over ৳3,000.",
    primary: { label: "Shop Thobe", href: "/categories/thobe" },
    secondary: { label: "Size Guide", href: "/products" },
    tone: { from: "#ece4d4", to: "#d4c6ab", ink: "#7a6440", text: "dark" },
  },
];

export type Testimonial = {
  id: string;
  name: string;
  city: string;
  rating: number;
  quote: string;
  bengali?: boolean;
  product: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Tanvir Ahmed",
    city: "Dhaka",
    rating: 5,
    quote:
      "The embroidery on the Noor panjabi is even finer in person. Fit is true to size and the cotton stays cool through Jumu'ah.",
    product: "Noor Embroidered Cotton Panjabi",
  },
  {
    id: "t2",
    name: "নুসরাত জাহান",
    city: "চট্টগ্রাম",
    rating: 5,
    quote: "আবায়ার ফেব্রিক অসাধারণ, একদম ছবির মতো। ডেলিভারি দুই দিনেই পেয়েছি, ক্যাশ অন ডেলিভারি থাকায় নিশ্চিন্তে অর্ডার করেছি।",
    bengali: true,
    product: "Safa Nida Open Abaya",
  },
  {
    id: "t3",
    name: "Imran Hossain",
    city: "Sylhet",
    rating: 5,
    quote:
      "Royal Oud lasts the whole day — I get compliments at the masjid every week. Packaging feels like a gift.",
    product: "Royal Oud Attar",
  },
  {
    id: "t4",
    name: "Farhana Rahman",
    city: "Rajshahi",
    rating: 4,
    quote:
      "Exchanged a size within 7 days without any hassle. The Layla abaya pleats are beautiful and hold their shape after washing.",
    product: "Layla Pleated Crepe Abaya",
  },
  {
    id: "t5",
    name: "মাহমুদুল হাসান",
    city: "খুলনা",
    rating: 5,
    quote: "এমিরাতি জুব্বাটা কুঁচকায় না, অফিস থেকে মসজিদ সারাদিন পরে থাকা যায়। দামের তুলনায় কোয়ালিটি অনেক ভালো।",
    bengali: true,
    product: "Emirati Classic Thobe",
  },
];

export type InstagramPost = {
  id: string;
  caption: string;
  likes: number;
  tone: { from: string; to: string; ink: string };
};

export const instagramPosts: InstagramPost[] = [
  { id: "ig1", caption: "Jumu'ah in ivory", likes: 2410, tone: { from: "#efe7d6", to: "#d9ccb0", ink: "#6d5a37" } },
  { id: "ig2", caption: "Nida, in motion", likes: 3870, tone: { from: "#2a2522", to: "#141110", ink: "#cbb38a" } },
  { id: "ig3", caption: "Oud & amber", likes: 1932, tone: { from: "#4a2f24", to: "#24160f", ink: "#e2c48e" } },
  { id: "ig4", caption: "Raw silk details", likes: 2766, tone: { from: "#d9c39a", to: "#b89e6c", ink: "#3c2f19" } },
  { id: "ig5", caption: "Emerald evenings", likes: 3104, tone: { from: "#1f4d3f", to: "#0f2a22", ink: "#d8c08a" } },
  { id: "ig6", caption: "Linen weekends", likes: 1588, tone: { from: "#a9bccb", to: "#7f95a6", ink: "#1f2a33" } },
];

export const instagramHandle = "@ribat.bd";
