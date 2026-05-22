import { apiRequest } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";

export async function getAssistantsForSession(session) {
  const publicData = await apiRequest(endpoints.publicAssistants);
  const publicItems = publicData.items || [];

  const canLoadPrivateAssistants = session?.authenticated && session?.role !== "guest";

  if (!canLoadPrivateAssistants) {
    return publicItems;
  }

  const privateData = await apiRequest(endpoints.privateAssistants);
  const privateItems = privateData.items || [];

  const byId = new Map();
  [...publicItems, ...privateItems].forEach((item) => byId.set(item.id, item));
  return [...byId.values()];
}