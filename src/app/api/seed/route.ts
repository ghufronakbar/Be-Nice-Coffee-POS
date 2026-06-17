import { getSeedPlanAction, runSeedAction } from "@/actions/seed"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)

  if (url.searchParams.get("run") === "true") {
    const result = await runSeedAction()

    return Response.json(result, { status: result.success ? 200 : 500 })
  }

  const plan = await getSeedPlanAction()

  return Response.json({
    success: true,
    message: "Seed plan tersedia. Gunakan POST /api/seed atau GET /api/seed?run=true untuk menjalankan.",
    plan,
  })
}

export async function POST() {
  const result = await runSeedAction()

  return Response.json(result, { status: result.success ? 200 : 500 })
}
