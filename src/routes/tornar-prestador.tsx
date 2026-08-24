import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tornar-prestador")({
  beforeLoad: () => {
    throw redirect({ to: "/registro", replace: true });
  },
});
