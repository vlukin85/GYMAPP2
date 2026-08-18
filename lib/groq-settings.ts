import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { isValidGroqApiKey } from "./groq-utils";

const GROQ_API_KEY_STORAGE_KEY = "ironrise.groq-api-key";

export { isValidGroqApiKey } from "./groq-utils";

export async function getGroqApiKey() {
  if (Platform.OS === "web") return AsyncStorage.getItem(GROQ_API_KEY_STORAGE_KEY);
  return SecureStore.getItemAsync(GROQ_API_KEY_STORAGE_KEY);
}

export async function saveGroqApiKey(value: string) {
  const key = value.trim();
  if (!isValidGroqApiKey(key)) throw new Error("Проверь формат ключа Groq: он должен начинаться с gsk_.");
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(GROQ_API_KEY_STORAGE_KEY, key);
    return;
  }
  await SecureStore.setItemAsync(GROQ_API_KEY_STORAGE_KEY, key);
}

export async function clearGroqApiKey() {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(GROQ_API_KEY_STORAGE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(GROQ_API_KEY_STORAGE_KEY);
}
