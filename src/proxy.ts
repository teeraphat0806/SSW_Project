import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const user = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const pathname = request.nextUrl.pathname;

  const protectedRoutes = [
    { prefix: "/superadminDashboard", allowedRoles: ["superadmin"] },
    {
      prefix: "/chatbot",
      allowedRoles: ["superadmin"],
    },
    {
      prefix: "/steel-Dashboard",
      allowedRoles: ["superadmin", "clerk", "supervisor", "delivery"],
    },
    {
      prefix: "/customer-Dashboard",
      allowedRoles: ["superadmin", "clerk", "supervisor"],
    },
    {
      prefix: "/saledashboard2",
      allowedRoles: ["superadmin", "clerk", "supervisor"],
    },
    {
      prefix: "/expenseDashboard",
      allowedRoles: ["superadmin", "clerk", "supervisor"],
    },
    { prefix: "/payroll", allowedRoles: ["superadmin"] },
    {
      prefix: "/receipt-invoice",
      allowedRoles: ["superadmin", "clerk", "supervisor"],
    },
    {
      prefix: "/dashboard",
      allowedRoles: ["superadmin", "clerk", "supervisor", "cutter", "delivery"],
    },
    {
      prefix: "/createneworder",
      allowedRoles: ["superadmin", "clerk", "supervisor"],
    },
    {
      prefix: "/job-order-detail",
      allowedRoles: ["superadmin", "clerk", "supervisor", "cutter", "delivery"],
    },
    {
      prefix: "/up-date-order",
      allowedRoles: ["superadmin", "clerk", "supervisor"],
    },
    {
      prefix: "/map",
      allowedRoles: [],
    },
    {
      prefix: "/statement",
      allowedRoles: ["superadmin", "clerk", "supervisor"],
    },
    {
      prefix: "/acquittance",
      allowedRoles: ["superadmin", "clerk", "supervisor"],
    },
  ];

  const matchedRoute = protectedRoutes.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  if (matchedRoute && !matchedRoute.allowedRoles.includes(user?.role ?? "")) {
    return NextResponse.redirect(new URL("/notFound", request.url));
  }

  return NextResponse.next();
}
