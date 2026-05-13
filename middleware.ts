export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/board/:path*", "/stats/:path*", "/settings/:path*"],
};
