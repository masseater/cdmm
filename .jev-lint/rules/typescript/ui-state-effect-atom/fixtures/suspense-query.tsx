import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

const accountsQuery = queryOptions({
  queryKey: ["accounts"],
  queryFn: () => fetch("/api/accounts").then((response) => response.json() as Promise<string[]>),
});

export const AccountNames = () => {
  const { data } = useSuspenseQuery(accountsQuery);
  return (
    <ul>
      {data.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  );
};
