import { useNavigate } from "@tanstack/react-router";
import { Button } from "../../components/button";
import { SearchField } from "../../components/search-field";
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
      action="/stores"
      method="get"
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
      <SearchField
        icon="pin"
        label="エリア"
        name="area"
        autoComplete="off"
        placeholder="エリア・市区町村"
        defaultValue={search.area}
        maxLength={100}
      />
      <SearchField
        className="keyword-field"
        icon="search"
        label="店舗名"
        type="search"
        name="q"
        placeholder="気になるお店・企業の名前"
        defaultValue={search.q}
        maxLength={100}
      />
      <Button type="submit">検索する</Button>
    </form>
  );
}
