import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

export type ServerCartDraftItem = {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  quantity: number;
  note?: string;
  options?: string;
  category?: string;
  image_url?: string;
};

export type ServerCartDraft = {
  items: ServerCartDraftItem[];
  updated_at: number;
};

function client() {
  return axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 18000,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function fetchTableCartDraft(sessionId: string): Promise<{
  draft: ServerCartDraft | null;
  inactive?: boolean;
}> {
  const res = await client().get(`/tables/session/${encodeURIComponent(sessionId)}/cart-draft`);
  if (res.data?.inactive) {
    return { draft: null, inactive: true };
  }
  const data = res.data?.data as ServerCartDraft | null | undefined;
  if (!data || !Array.isArray(data.items)) {
    return { draft: null };
  }
  return {
    draft: {
      items: data.items,
      updated_at: Number(data.updated_at) || 0,
    },
  };
}

export async function saveTableCartDraft(sessionId: string, draft: ServerCartDraft): Promise<void> {
  await client().put(`/tables/session/${encodeURIComponent(sessionId)}/cart-draft`, draft);
}
