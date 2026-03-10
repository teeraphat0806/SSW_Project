import {z} from "zod";
import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { calculateWeightDetails } from "@/lib/calculateGrandTotal";
import { CreateNewOrderSchema } from "@/lib/schemas/createNewOrder.shema";
import { ShapeSteel } from "@/types";