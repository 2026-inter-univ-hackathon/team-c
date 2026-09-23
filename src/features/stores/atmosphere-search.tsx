import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "../../components/button";
import { Icon } from "../../components/icon";
import { defaultSearch, type StoreSearch } from "../../schemas/store-search";

const examples = ["店長が優しい", "シフトを相談しやすい", "学校と両立しやすい"];

export function AtmosphereSearch({
  search = defaultSearch,
}: {
  search?: StoreSearch;
}) {
  const [value, setValue] = useState(search.atmosphere);
  const navigate = useNavigate();
  const pending = useRouterState({
    select: (state) => state.status === "pending",
  });
  return (
    <form
      className="atmosphere-search"
      role="search"
      aria-label="雰囲気検索"
      onSubmit={(event) => {
        event.preventDefault();
        const atmosphere = value.trim();
        void navigate({
          to: "/stores",
          search: {
            ...search,
            atmosphere,
            sort: atmosphere ? "relevance" : "name",
            page: 1,
          },
        });
      }}
    >
      <label>
        <span className="atmosphere-label">
          <Icon name="chat" size={18} />
          どんな職場で働きたい？
        </span>
        <span className="atmosphere-input-row">
          <input
            name="atmosphere"
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={200}
            placeholder="例：店長が優しく、シフトを相談しやすい"
            aria-describedby="atmosphere-help"
          />
        </span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "検索中…" : "雰囲気で探す"}
      </Button>
      <div className="atmosphere-examples">
        <span>例えば：</span>
        {examples.map((example) => (
          <button key={example} type="button" onClick={() => setValue(example)}>
            {example}
          </button>
        ))}
      </div>
      <p id="atmosphere-help">
        口コミの意味から探します。検索文はOpenAIに送信されます。個人情報は入力しないでください。
      </p>
    </form>
  );
}
