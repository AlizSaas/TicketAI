import { useMutation, useQueryClient, QueryFilters } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateTicketStatus } from './action';
import { AssignedTicket } from '@/lib/types';
import { assignedTicketsProps } from './mod-ui';
import { TicketFormValues } from '../dashboard/user-dash-ui';
import { createTicket } from '../dashboard/action';

export function useUpdateTicketStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ticketId, status }: { ticketId: string; status: "RESOLVED" | "REJECTED" }) => {
            await updateTicketStatus(ticketId, status);
            return { ticketId, status };
        },
        onMutate: async ({ ticketId, status }) => {
            const queryFilter: QueryFilters = { queryKey: ['assignedTickets'] };
            await queryClient.cancelQueries(queryFilter);

            const previous = queryClient.getQueryData(['assignedTickets']);

            queryClient.setQueryData(['assignedTickets'], (old: assignedTicketsProps | undefined) => {
                if (!old) return undefined
          
        return {
          ...old,
          assignedTickets: old.assignedTickets.map((ticket: AssignedTicket) =>
            ticket.id === ticketId ? { ...ticket, status } : ticket
          ),
        };
            }); // Optimistically update the ticket status

            return { previous };
        },
        onError: (_error, _vars, context) => {
            toast.error("Failed to update ticket status");
            if (context?.previous) {
                queryClient.setQueryData(['assignedTickets'], context.previous);
            }
        },
        onSuccess: () => {
            toast.success("Ticket updated");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['assignedTickets'] });
        },
    });
}


 

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TicketFormValues) => {
      return await createTicket(data); // Calls server + Inngest
    },

    onMutate: async (newTicketData) => {
      const userDataKey = ['userData'];

      // Cancel any outgoing fetches
      await queryClient.cancelQueries({ queryKey: userDataKey });

      const previousUserData = queryClient.getQueryData(userDataKey) as {
        tickets: typeof newTicketData[]; // Adjust to your actual shape if needed
      };

        const optimisticTicket = {
            ...newTicketData,
            id: crypto.randomUUID(), // Generate a temporary ID
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'PENDING', // Assuming new tickets start with PENDING status
        };

      queryClient.setQueryData(userDataKey, (old: { tickets: typeof newTicketData[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          tickets: [optimisticTicket, ...old.tickets],
        };
      });

      return { previousUserData };
    },

    onError: (_error, _vars, context) => {
      toast.error("❌ Failed to create ticket");
      if (context?.previousUserData) {
        queryClient.setQueryData(['userData'], context.previousUserData);
      }
    },

    onSuccess: () => {
      toast.success("✅ Ticket created!");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['userData'] });
    },
  });
}
