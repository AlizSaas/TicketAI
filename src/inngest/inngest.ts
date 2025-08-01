
import { Inngest } from 'inngest';


// Keep your existing Inngest client
export const inngest = new Inngest({
  id: 'ticketing-system',
  name: 'Ticketing System Inngest',
  eventKey: process.env.INNGEST_EVENT_KEY!,
  signingKey: process.env.INNGEST_SIGNING_KEY!,
 

  


});

