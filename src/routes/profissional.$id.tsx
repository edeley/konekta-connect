import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/profissional/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/prestador/$id", params: { id: params.id }, replace: true });
  },
});
