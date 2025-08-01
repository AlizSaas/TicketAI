import {inngest} from '@/inngest/inngest'
import {assignTicket,updateTicketStatus} from '@/inngest/function'
import {serve} from 'inngest/next'

export const { POST,GET,PUT } = serve({
    client: inngest,
    functions:[
        assignTicket,
        updateTicketStatus
    ]
})

