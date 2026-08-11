import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/register/client")({
  beforeLoad: () => {
    throw redirect({ to: "/registro", replace: true });
  },
});
