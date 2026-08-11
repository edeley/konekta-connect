import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/choose-role")({
  beforeLoad: () => {
    throw redirect({ to: "/registro", replace: true });
  },
});
