/** Static homepage content (testimonials, Instagram) until it moves to the Banner model / Settings. */

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
