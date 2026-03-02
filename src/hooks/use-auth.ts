import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthUser } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const query = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ user: AuthUser }>("/api/v1/auth/me");
        return response.user;
      } catch (err) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post("/api/v1/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth-me"], null);
      router.push("/login");
    },
  });

  return {
    ...query,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
