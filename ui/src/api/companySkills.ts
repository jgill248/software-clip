import type {
  CompanySkill,
  CompanySkillCreateRequest,
  CompanySkillDetail,
  CompanySkillFileDetail,
  CompanySkillImportResult,
  CompanySkillListItem,
  CompanySkillProjectScanRequest,
  CompanySkillProjectScanResult,
  CompanySkillUpdateStatus,
} from "@softclipai/shared";
import { api } from "./client";

export const companySkillsApi = {
  list: (productId: string) =>
    api.get<CompanySkillListItem[]>(`/companies/${encodeURIComponent(productId)}/skills`),
  detail: (productId: string, skillId: string) =>
    api.get<CompanySkillDetail>(
      `/companies/${encodeURIComponent(productId)}/skills/${encodeURIComponent(skillId)}`,
    ),
  updateStatus: (productId: string, skillId: string) =>
    api.get<CompanySkillUpdateStatus>(
      `/companies/${encodeURIComponent(productId)}/skills/${encodeURIComponent(skillId)}/update-status`,
    ),
  file: (productId: string, skillId: string, relativePath: string) =>
    api.get<CompanySkillFileDetail>(
      `/companies/${encodeURIComponent(productId)}/skills/${encodeURIComponent(skillId)}/files?path=${encodeURIComponent(relativePath)}`,
    ),
  updateFile: (productId: string, skillId: string, path: string, content: string) =>
    api.patch<CompanySkillFileDetail>(
      `/companies/${encodeURIComponent(productId)}/skills/${encodeURIComponent(skillId)}/files`,
      { path, content },
    ),
  create: (productId: string, payload: CompanySkillCreateRequest) =>
    api.post<CompanySkill>(
      `/companies/${encodeURIComponent(productId)}/skills`,
      payload,
    ),
  importFromSource: (productId: string, source: string) =>
    api.post<CompanySkillImportResult>(
      `/companies/${encodeURIComponent(productId)}/skills/import`,
      { source },
    ),
  scanProjects: (productId: string, payload: CompanySkillProjectScanRequest = {}) =>
    api.post<CompanySkillProjectScanResult>(
      `/companies/${encodeURIComponent(productId)}/skills/scan-projects`,
      payload,
    ),
  installUpdate: (productId: string, skillId: string) =>
    api.post<CompanySkill>(
      `/companies/${encodeURIComponent(productId)}/skills/${encodeURIComponent(skillId)}/install-update`,
      {},
    ),
  delete: (productId: string, skillId: string) =>
    api.delete<CompanySkill>(
      `/companies/${encodeURIComponent(productId)}/skills/${encodeURIComponent(skillId)}`,
    ),
};
