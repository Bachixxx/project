Deno.serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({ error: 'Function disabled' }),
    { headers: { 'Content-Type': 'application/json' }, status: 404 }
  );
});
