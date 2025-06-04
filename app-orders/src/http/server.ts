import { fastify } from "fastify";
import { fastifyCors } from "@fastify/cors";
import { z } from "zod";

import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { channels } from "../broker/channels/index.ts";
import { db } from "../db/client.ts";
import { schema } from "../db/schema/index.ts";
import { dispatchOrderCreated } from "../broker/messages/order-created.ts";
const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(fastifyCors, {
  origin: "*",
});

app.get("/health", () => {
  return "OK";
});

app.post(
  "/orders",
  {
    schema: {
      body: z.object({
        amount: z.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body;

    console.log("New order received:", {
      amount,
    });
    const orderId = crypto.randomUUID();
    dispatchOrderCreated({
      orderId,
      amount,
      customer: {
        id: "1717972d-63b9-4510-bb3a-d9f0bffa959e",
      },
    });

    await db.insert(schema.orders).values({
      id: crypto.randomUUID(),
      customerId: "1717972d-63b9-4510-bb3a-d9f0bffa959e",
      amount,
    });

    return reply.status(201).send();
  }
);

app.listen({ host: "0.0.0.0", port: 3333 }).then(() => {
  console.log("[Orders] HTTP server running");
});
