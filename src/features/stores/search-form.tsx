import { useNavigate } from "@tanstack/react-router";
import { Icon } from "../../components/icon";
import { defaultSearch, type StoreSearch } from "../../schemas/store-search";
export function SearchForm({
  search = defaultSearch,
}: {
  search?: StoreSearch;
}) {
  const navigate = useNavigate();
  return (
    <form
      className="search-bar"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void navigate({
          to: "/stores",
          search: {
            ...search,
            q: String(data.get("q") ?? "").trim(),
            area: String(data.get("area") ?? "").trim(),
            page: 1,
          },
        });
      }}
    >
      <label>
        <Icon name="pin" />
        <span className="sr-only">エリア</span>
        <input
          name="area"
          placeholder="エリア・市区町村"
          defaultValue={search.area}
          maxLength={100}
        />
      </label>
      <label className="keyword-field">
        <Icon name="search" />
        <span className="sr-only">店舗名</span>
        <input
          name="q"
          placeholder="気になるお店・企業の名前"
          defaultValue={search.q}
          maxLength={100}
        />
      </label>
      <button className="button primary" type="submit">
        <Icon name="search" size={18} />
        検索する
      </button>
    </form>
  );
}
