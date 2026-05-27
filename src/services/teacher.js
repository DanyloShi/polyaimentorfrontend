import { apiRequest, readResponseBody } from "../api/client.js";
import { API_BASE_URL, endpoints } from "../api/endpoints.js";

export async function getTeacherAssistants() {
  const data = await apiRequest(endpoints.privateAssistants);
  return data.items || [];
}

export async function getTeacherAssistantById(assistantId) {
  return await apiRequest(`/assistants/${assistantId}`);
}

export async function updateTeacherAssistant(assistantId, { title, modelId, isPublic }) {
  return await apiRequest(`/assistants/${assistantId}`, {
    method: "PATCH",
    body: JSON.stringify({
      title,
      model_id: modelId,
      is_public: isPublic,
    }),
  });
}

export async function deleteTeacherAssistant(assistantId) {
  await apiRequest(`/assistants/${assistantId}`, {
    method: "DELETE",
  });
}

export async function createTeacherAssistant({ title, modelId, isPublic }) {
  return await apiRequest(endpoints.privateAssistants, {
    method: "POST",
    body: JSON.stringify({
      title,
      model_id: modelId,
      is_public: isPublic,
    }),
  });
}

export async function getAssistantCreateOptions() {
  const data = await apiRequest(endpoints.models);
  return {
    models: data.items || [],
  };
}

export async function getAssistantDocuments(assistantId) {
  const data = await apiRequest(`${endpoints.documents}?assistant_id=${encodeURIComponent(assistantId)}`);
  return data.items || [];
}

export async function uploadAssistantDocument(assistantId, file) {
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

export async function deleteAssistantDocument(_assistantId, sourceId) {
  await apiRequest(endpoints.deleteDocument(sourceId), { method: "DELETE" });
}

export async function getAssistantStudents(assistantId) {
  const data = await apiRequest(`/assistants/${assistantId}/students`);
  return data.items || [];
}

export async function searchStudentsByEmail(query) {
  const normalized = query.trim();
  if (normalized.length < 2) {
    return [];
  }

  const data = await apiRequest(`/users/search?q=${encodeURIComponent(normalized)}&exclude_role=admin`);
  return (data.items || []).filter((user) => user.role === "student");
}

export async function addStudentToAssistant(assistantId, student) {
  await apiRequest(endpoints.assistantAccess(assistantId), {
    method: "POST",
    body: JSON.stringify({
      user_id: student.id,
      access_role: "user",
    }),
  });

  return getAssistantStudents(assistantId);
}

export async function removeStudentFromAssistant(assistantId, studentId) {
  await apiRequest(`/assistants/${assistantId}/access/${studentId}`, {
    method: "DELETE",
  });
  return getAssistantStudents(assistantId);
}

export async function getStudentChatForAssistant(assistantId, studentId) {
  const data = await apiRequest(`/assistants/${assistantId}/students/${studentId}/conversation`);
  return data.messages || [];
}

export async function getTeacherAssistantSystemPrompt(assistantId) {
  return await apiRequest(endpoints.assistantSystemPrompt(assistantId));
}

export async function setTeacherAssistantSystemPrompt(assistantId, content) {
  return await apiRequest(endpoints.assistantSystemPrompt(assistantId), {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export async function deleteTeacherAssistantSystemPrompt(assistantId) {
  return await apiRequest(endpoints.assistantSystemPrompt(assistantId), {
    method: "DELETE",
  });
}

export async function getTeacherPromptSourceAssistants(currentAssistantId = "") {
  const assistants = await getTeacherAssistants();
  const candidates = assistants.filter((assistant) => assistant.id !== currentAssistantId);

  const items = await Promise.all(
    candidates.map(async (assistant) => {
      try {
        const prompt = await getTeacherAssistantSystemPrompt(assistant.id);
        if (!prompt?.content?.trim()) {
          return null;
        }

        return {
          ...assistant,
          promptPreview: prompt.content.trim().slice(0, 220),
        };
      } catch {
        return null;
      }
    }),
  );

  return items.filter(Boolean);
}
