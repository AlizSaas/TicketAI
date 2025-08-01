import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteInvitationCode, generateInvitationCode } from "../actions";
import { toast } from "sonner";
import { CodesResponse } from "../types";

export function useGenerateCodeMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: generateInvitationCode,
    onSuccess: async (newCode) => {
      const queryFilter: QueryFilters = { queryKey: ["invitation-codes"] };
      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<InfiniteData<CodesResponse, string | null>>(
        queryFilter,
        (oldData) => {
          const firstPage = oldData?.pages[0];
          if (firstPage)
            return {
                       pageParams: oldData.pageParams,
                       pages: [
                           {
                               codes:[newCode,...firstPage.codes],
                               nextCursor: firstPage.nextCursor

                           },
                            ...oldData.pages.slice(1)
                        ]
                    };
                }
        
      );

      await queryClient.invalidateQueries({ queryKey: ["adminData"] });

      toast.success("Invitation code generated successfully");
    },
    onError: (error) => {
      console.error("Error generating code:", error);
      toast.error("Failed to generate invitation code");
    },
  });
  return mutation;
}

export function useDeleteCodeMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteInvitationCode,
    onSuccess: async (deletedCode) => {
      // Optimistically update the cache
      queryClient.setQueriesData<InfiniteData<CodesResponse, string | null>>(
        { queryKey: ["invitation-codes"] }, // Adjust the query key as needed
        (oldData) => {
          if (!oldData) return oldData;

             return {
            pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => ({
            nextCursor: page.nextCursor,
            codes: page.codes.filter((code) => code.id !== deletedCode?.id),
          })),
          };
        }
      );

      // Invalidate both queries to trigger refetches
      await queryClient.invalidateQueries({ queryKey: ["invitation-codes"] });
      await queryClient.invalidateQueries({ queryKey: ["adminData"] });

      toast.success("Invitation code deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting code:", error);
      toast.error("Failed to delete invitation code");
    },
  });

  return mutation;
}
