import { useSyncExternalStore } from "react";
import { useFavoriteFeedback } from "./favorite-feedback";
const KEY = "baito-honne:favorites:v1";
const EVENT = "honne:favorites";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseFavorites(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string => typeof id === "string" && UUID.test(id),
            ),
          ),
        ].slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
function snapshot() {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}
export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const setMessage = useFavoriteFeedback();
  const ids = parseFavorites(raw);
  function toggle(id: string) {
    const current = parseFavorites(snapshot());
    if (!UUID.test(id)) return;
    if (!current.includes(id) && current.length >= 100) {
      setMessage("保存は100件までです。ほかの店舗の保存を解除してください。");
      return;
    }
    const next = current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVENT));
      setMessage(
        next.includes(id)
          ? "気になる店舗に保存しました。"
          : "保存を解除しました。",
      );
    } catch {
      setMessage(
        "このブラウザでは保存できません。保存の設定を確認してください。",
      );
    }
  }
  function clear() {
    try {
      localStorage.removeItem(KEY);
      window.dispatchEvent(new Event(EVENT));
      setMessage("保存した職場をすべて解除しました。");
    } catch {
      setMessage(
        "保存を解除できません。ブラウザの保存設定を確認してください。",
      );
    }
  }
  return { ids, raw, toggle, clear };
}
