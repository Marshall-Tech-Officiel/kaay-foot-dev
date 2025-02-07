
import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 0, // Set to 0 to always refetch on mount
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true, // Enable refetch on window focus
      refetchOnReconnect: true, // Enable refetch on reconnect
    },
  },
})
