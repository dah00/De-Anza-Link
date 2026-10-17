import { suggestAddresses } from "@/lib/address-suggest";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const addresses = await suggestAddresses(q);
    return Response.json({ addresses });
  } catch {
    return Response.json(
      { error: "Couldn't look up addresses." },
      { status: 502 },
    );
  }
}
