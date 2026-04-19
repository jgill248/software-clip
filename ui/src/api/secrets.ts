import type { CompanySecret, SecretProviderDescriptor, SecretProvider } from "@softclipai/shared";
import { api } from "./client";

export const secretsApi = {
  list: (productId: string) => api.get<CompanySecret[]>(`/companies/${productId}/secrets`),
  providers: (productId: string) =>
    api.get<SecretProviderDescriptor[]>(`/companies/${productId}/secret-providers`),
  create: (
    productId: string,
    data: {
      name: string;
      value: string;
      provider?: SecretProvider;
      description?: string | null;
      externalRef?: string | null;
    },
  ) => api.post<CompanySecret>(`/companies/${productId}/secrets`, data),
  rotate: (id: string, data: { value: string; externalRef?: string | null }) =>
    api.post<CompanySecret>(`/secrets/${id}/rotate`, data),
  update: (
    id: string,
    data: { name?: string; description?: string | null; externalRef?: string | null },
  ) => api.patch<CompanySecret>(`/secrets/${id}`, data),
  remove: (id: string) => api.delete<{ ok: true }>(`/secrets/${id}`),
};
