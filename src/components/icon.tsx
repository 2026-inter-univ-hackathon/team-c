export function Icon({
  name,
  size = 20,
}: {
  name:
    | "search"
    | "heart"
    | "arrow"
    | "pin"
    | "star"
    | "chat"
    | "shield"
    | "alert"
    | "lock";
  size?: number;
}) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    star: (
      <path d="m12 2 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1Z" />
    ),
    chat: (
      <path d="M21 11.5a9 9 0 0 1-9 9c-1.5 0-3-.4-4.2-1L3 21l1.5-4.8A9 9 0 1 1 21 11.5Z" />
    ),
    shield: (
      <path d="M12 3.5 4.5 6v6c0 5 3.2 7.9 7.5 8.5 4.3-.6 7.5-3.5 7.5-8.5V6L12 3.5Z" />
    ),
    alert: (
      <>
        <path d="M12 3.5 2.5 20h19L12 3.5Z" />
        <path d="M12 10v4" />
        <path d="M12 17.2v.1" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10.5" width="14" height="10" rx="2" />
        <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        <path d="M12 14.5v2.5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
