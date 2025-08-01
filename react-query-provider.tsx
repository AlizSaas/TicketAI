"use client";

import { useState,  } from "react";
import { QueryClient, QueryClientProvider, QueryCache, hashKey } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useAuth } from "@clerk/nextjs";

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = useAuth();

  const [queryClient] = useState(() => {
    return new QueryClient({
      queryCache: new QueryCache({
        onError: (err) => {
          console.error("Query error:", err);
        },
      }),
      defaultOptions: {
        queries: {
          retry: 1, // Retry failed queries once
  
          queryKeyHashFn: (queryKey) => hashKey([{ userId }, ...queryKey]), // 🧠 Scope cache by user
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
