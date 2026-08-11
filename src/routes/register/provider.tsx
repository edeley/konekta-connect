import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/register/provider")({
  beforeLoad: () => {
    throw redirect({ to: "/registro", replace: true });
  },
});
