import {z} from 'zod'

export const CreateNewOrderSchema = z.object({
    customerId: z.number().int().positive(),
    yourRef: z.string(),
    credit: z.coerce.date().optional(),
    deliveryDate: z.coerce.date(),
    salesName: z.string().optional(),
    vat: z.number(),
    orderPOs: z.array(
        z.object({
        poNumber: z.string(),
        customerId: z.number().int().positive().optional(),
        total: z.number(),
        vat: z.number(),
        urlPo: z.array(z.string()),
        date: z.coerce.date().optional(),
        products: z.array(
            z.object({
            steelType: z.string(),
            wide: z.number(),
            length: z.number(),
            thickness: z.number(),
            amount: z.number(),
            total: z.number(),
            detail: z.string().optional()
            })
        )
        })
    )
})