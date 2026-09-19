import { Button } from "./button";

export function Pagination({
  label,
  page,
  pageCount,
  onPageChange,
}: {
  label: string;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav className="pagination" aria-label={label}>
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        前へ
      </Button>
      <span>
        {page} / {pageCount}
      </span>
      <Button
        variant="secondary"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        次へ
      </Button>
    </nav>
  );
}
