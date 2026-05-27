import { apiRequest, readResponseBody } from "../api/client.js";
import { API_BASE_URL, endpoints } from "../api/endpoints.js";

export async function getAdminAssistants() {
  const data = await apiRequest(endpoints.privateAssistants);
  return data.items || [];
}

export async function getAdminAssistantById(assistantId) {
  return await apiRequest(`/assistants/${assistantId}`);
}

export async function updateAdminAssistant(assistantId, { title, modelId, isPublic }) {
  return await apiRequest(`/assistants/${assistantId}`, {
    method: "PATCH",
    body: JSON.stringify({
      title,
      model_id: modelId,
      is_public: isPublic,
    }),
  });
}

export async function deleteAdminAssistant(assistantId) {
  await apiRequest(`/assistants/${assistantId}`, {
    method: "DELETE",
  });
}

export async function createAdminAssistant({ title, modelId, isPublic }) {
  return await apiRequest(endpoints.privateAssistants, {
    method: "POST",
    body: JSON.stringify({
      title,
      model_id: modelId,
      is_public: isPublic,
    }),
  });
}

export async function getAdminAssistantDocuments(assistantId) {
  const data = await apiRequest(`${endpoints.documents}?assistant_id=${encodeURIComponent(assistantId)}`);
  return data.items || [];
}

export async function uploadAdminAssistantDocument(assistantId, file) {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE_URL}${endpoints.uploadDocument}?assistant_id=${encodeURIComponent(assistantId)}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(
      (typeof body === "string" ? body : body?.message || body?.detail) || `HTTP ${response.status}`,
    );
  }

  return body;
}

export async function deleteAdminAssistantDocument(_assistantId, sourceId) {
  await apiRequest(endpoints.deleteDocument(sourceId), { method: "DELETE" });
}

export async function getAdminAssistantStudents(assistantId) {
  const data = await apiRequest(`/assistants/${assistantId}/students`);
  return data.items || [];
}

export async function searchAdminStudentsByEmail(query) {
  const normalized = query.trim();
  if (normalized.length < 2) {
    return [];
  }

  const data = await apiRequest(`/users/search?q=${encodeURIComponent(normalized)}&exclude_role=admin`);
  return (data.items || []).filter((user) => user.role === "student");
}

export async function addStudentToAdminAssistant(assistantId, student) {
  await apiRequest(endpoints.assistantAccess(assistantId), {
    method: "POST",
    body: JSON.stringify({
      user_id: student.id,
      access_role: "user",
    }),
  });

  return getAdminAssistantStudents(assistantId);
}

export async function removeStudentFromAdminAssistant(assistantId, studentId) {
  await apiRequest(`/assistants/${assistantId}/access/${studentId}`, {
    method: "DELETE",
  });
  return getAdminAssistantStudents(assistantId);
}

export async function getAdminStudentChatForAssistant(assistantId, studentId) {
  const data = await apiRequest(`/assistants/${assistantId}/students/${studentId}/conversation`);
  return data.messages || [];
}

export async function getAdminModels() {
  const data = await apiRequest(endpoints.models);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.models)) return data.models;
  return [];
}

export async function getAdminModel(modelId) {
  return await apiRequest(endpoints.modelById(modelId));
}

export async function createAdminModel(payload) {
  return await apiRequest(endpoints.models, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminModel(modelId, payload) {
  return await apiRequest(endpoints.modelById(modelId), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminModel(modelId) {
  await apiRequest(endpoints.modelById(modelId), {
    method: "DELETE",
  });
}

export async function searchUsers(query) {
  const normalized = query.trim();
  if (normalized.length < 2) {
    return [];
  }

  const data = await apiRequest(`/users/search?q=${encodeURIComponent(normalized)}`);
  return data.items || [];
}

export async function assignUserRole(userId, role) {
  return await apiRequest(`/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function getAdminAssistantSystemPrompt(assistantId) {
  return await apiRequest(endpoints.assistantSystemPrompt(assistantId));
}

export async function setAdminAssistantSystemPrompt(assistantId, content) {
  return await apiRequest(endpoints.assistantSystemPrompt(assistantId), {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export async function getAdminPromptSourceAssistants(currentAssistantId = "") {
  const assistants = await getAdminAssistants();

  return assistants.filter((assistant) => assistant.id !== currentAssistantId);
}
