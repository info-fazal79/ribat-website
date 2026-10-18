export const siteConfig = {
  name: "Ribat",
  tagline: "Islamic Lifestyle & Premium Clothing",
  description:
    "Ribat — premium Islamic lifestyle clothing from Bangladesh. Panjabi, thobe, abaya and modest essentials, delivered nationwide with Cash on Delivery.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_BD",
  currency: "BDT",
  orderNumberPrefix: "RBT-",
  contact: {
    phone: "",
    email: "",
    whatsapp: "",
  },
} as const;

export const storefrontNav = [
  { title: "New Arrivals", href: "/products" },
  { title: "Panjabi", href: "/categories/panjabi" },
  { title: "Thobe", href: "/categories/thobe" },
  { title: "Abaya", href: "/categories/abaya" },
  { title: "Casual", href: "/categories/casual" },
  { title: "Fragrance", href: "/categories/fragrance" },
] as const;

export const announcements = [
  "Free delivery on orders over ৳3,000",
  "ক্যাশ অন ডেলিভারি — সারা বাংলাদেশে",
  "7-day easy exchange",
  "The Eid Edit is here — up to 25% off",
] as const;

export const adminNav = [
  { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { title: "Orders", href: "/admin/orders", icon: "ShoppingBag" },
  { title: "Products", href: "/admin/products", icon: "Shirt" },
  { title: "Categories", href: "/admin/categories", icon: "FolderTree" },
  { title: "Inventory", href: "/admin/inventory", icon: "Boxes" },
  { title: "Landing Pages", href: "/admin/landing-pages", icon: "PanelsTopLeft" },
  { title: "Coupons", href: "/admin/coupons", icon: "TicketPercent" },
  { title: "Customers", href: "/admin/customers", icon: "Users" },
  { title: "Settings", href: "/admin/settings", icon: "Settings" },
] as const;
