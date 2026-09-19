import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
const FavoriteFeedbackContext = createContext<(message: string) => void>(
  () => {},
);
export function FavoriteFeedbackProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [notice, setNotice] = useState<{ message: string } | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  return (
    <FavoriteFeedbackContext.Provider
      value={(message) => setNotice({ message })}
    >
      {children}
      <div className="favorite-notice" data-visible={notice !== null}>
        <p role="status" aria-atomic="true">
          {notice?.message ?? ""}
        </p>
      </div>
    </FavoriteFeedbackContext.Provider>
  );
}
export function useFavoriteFeedback() {
  return useContext(FavoriteFeedbackContext);
}
