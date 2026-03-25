import { API_BASE_URL } from "@/lib/config";

export type ApiService = {
  _id: string;
  title: string;
  description: string;
  image: string;
  alt?: string;
  items?: string[];
  isActive?: boolean;
  /** Service price from API (AUD). */
  price?: number | string;
};

type ServicesApiResponse = {
  success: boolean;
  data: ApiService[];
};

async function fetchServices(): Promise<ApiService[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/services`, {
    credentials: "include",
  });
  const json: ServicesApiResponse = await res.json();
  if (!res.ok || !json.success) {
    throw new Error("Failed to fetch services");
  }
  return json.data || [];
}

export async function getServices(): Promise<
  {
    title: string;
    description: string;
    image: string;
    tag?: string | null;
    items?: string[];
    price?: number | string;
  }[]
> {
  const data = await fetchServices();
  return data
    .filter((s) => s.isActive !== false)
    .map((s) => ({
      title: s.title,
      description: s.description,
      image: s.image || "",
      tag: null as string | null,
      items: s.items || [],
      price: s.price,
    }));
}

export async function getCategories(): Promise<
  {
    _id: string;
    name: string;
    description: string;
    image: string;
    alt: string;
    items: string[];
    price?: number | string;
  }[]
> {
  const data = await fetchServices();
  return data
    .filter((s) => s.isActive !== false)
    .map((s) => ({
      _id: s._id,
      name: s.title,
      description: s.description,
      image: s.image || "",
      alt: s.alt || s.title,
      items: s.items || [],
      price: s.price,
    }));
}

export async function getServiceTitles(): Promise<string[]> {
  const data = await fetchServices();
  const titles: string[] = [];
  for (const s of data) {
    if (s.isActive !== false) {
      titles.push(s.title);
      if (s.items?.length) titles.push(...s.items);
    }
  }
  return Array.from(new Set(titles));
}

export async function getServicesForBooking(): Promise<{ id: string; title: string }[]> {
  const data = await fetchServices();
  return data
    .filter((s) => s.isActive !== false)
    .map((s) => ({ id: s._id, title: s.title }));
}
