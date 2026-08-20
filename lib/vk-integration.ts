import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { buildVkAuthorizeUrl, getVkRedirectUri } from "./vk-oauth-url";

export { buildVkAuthorizeUrl, getVkRedirectUri } from "./vk-oauth-url";

const VK_API_VERSION = "5.199";
const VK_SESSION_KEY = "ironrise.vk-session.v1";
const VK_APP_ID = process.env.EXPO_PUBLIC_VK_APP_ID?.trim() ?? "";

export type VkSession = { accessToken: string; refreshToken?: string; userId: string; expiresAt: number };

export function isVkConfigured() {
  return /^\d+$/.test(VK_APP_ID);
}

function base64Url(value: string) {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createPkce() {
  const verifier = `${Crypto.randomUUID().replace(/-/g, "")}${Crypto.randomUUID().replace(/-/g, "")}`;
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 });
  return { verifier, challenge: base64Url(hash), state: Crypto.randomUUID().replace(/-/g, "") };
}

export async function getVkSession() {
  const raw = await SecureStore.getItemAsync(VK_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as VkSession;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function clearVkSession() {
  await SecureStore.deleteItemAsync(VK_SESSION_KEY);
}

export async function signInWithVk() {
  if (!isVkConfigured()) throw new Error("Для VK ID укажите ID Android-приложения VK в конфигурации IronRise.");
  const pkce = await createPkce();
  const { url } = buildVkAuthorizeUrl({ appId: VK_APP_ID, verifier: pkce.verifier, challenge: pkce.challenge, state: pkce.state });
  const result = await WebBrowser.openAuthSessionAsync(url, getVkRedirectUri(VK_APP_ID));
  if (result.type !== "success") return null;
  const query = new URLSearchParams(result.url.split("?")[1] ?? "");
  const code = query.get("code") ?? "";
  const deviceId = query.get("device_id") ?? "";
  const state = query.get("state") ?? "";
  if (!code || !deviceId || state !== pkce.state) throw new Error("VK ID не подтвердил авторизацию. Попробуйте войти ещё раз.");
  const tokenResponse = await fetch("https://id.vk.ru/oauth2/auth", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: VK_APP_ID, grant_type: "authorization_code", code_verifier: pkce.verifier, device_id: deviceId, code, redirect_uri: getVkRedirectUri(VK_APP_ID), state: pkce.state }).toString(),
  });
  if (!tokenResponse.ok) throw new Error("VK ID не смог выдать токен. Проверьте настройки приложения в консоли VK.");
  const payload = await tokenResponse.json() as { access_token?: string; refresh_token?: string; user_id?: string | number; expires_in?: number };
  if (!payload.access_token || !payload.user_id) throw new Error("VK ID вернул неполный ответ авторизации.");
  const session: VkSession = { accessToken: payload.access_token, refreshToken: payload.refresh_token, userId: String(payload.user_id), expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000 };
  await SecureStore.setItemAsync(VK_SESSION_KEY, JSON.stringify(session));
  return session;
}

async function callVkMethod<T>(method: string, params: Record<string, string>) {
  const session = await getVkSession();
  if (!session) throw new Error("Сначала войдите через VK ID.");
  const query = new URLSearchParams({ ...params, access_token: session.accessToken, v: VK_API_VERSION });
  const response = await fetch(`https://api.vk.com/method/${method}?${query.toString()}`);
  const payload = await response.json() as { response?: T; error?: { error_msg?: string } };
  if (!response.ok || payload.error || !payload.response) throw new Error(payload.error?.error_msg ?? "VK API не принял запрос.");
  return payload.response;
}

async function uploadVkWallPhoto(imageUri: string) {
  const server = await callVkMethod<{ upload_url: string }>("photos.getWallUploadServer", {});
  const form = new FormData();
  const photo: any = Platform.OS === "web" ? await (await fetch(imageUri)).blob() : { uri: imageUri, type: "image/png", name: "ironrise-workout.png" };
  form.append("photo", photo);
  const uploadResponse = await fetch(server.upload_url, { method: "POST", body: form });
  if (!uploadResponse.ok) throw new Error("Не удалось загрузить изображение в VK.");
  const upload = await uploadResponse.json() as { server?: number; photo?: string; hash?: string };
  if (!upload.server || !upload.photo || !upload.hash) throw new Error("VK вернул неполный ответ загрузки изображения.");
  const saved = await callVkMethod<Array<{ id: number; owner_id: number }>>("photos.saveWallPhoto", { server: String(upload.server), photo: upload.photo, hash: upload.hash });
  const photoResult = saved[0];
  if (!photoResult) throw new Error("VK не сохранил фотографию для стены.");
  return `photo${photoResult.owner_id}_${photoResult.id}`;
}

export async function publishWorkoutToVk({ message, imageUri }: { message: string; imageUri?: string }) {
  const attachments = imageUri ? await uploadVkWallPhoto(imageUri) : "";
  return callVkMethod<{ post_id: number }>("wall.post", { message, ...(attachments ? { attachments } : {}) });
}
