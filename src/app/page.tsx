import { redirect } from "next/navigation";
import { IS_TESTNET, TESTNET_HOME } from "@/lib/constants/networkAccess";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The redirect would otherwise drop the query string, losing referral
  // attribution for links shaped like /?ref=CODE.
  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref.trim() : "";
  const home = IS_TESTNET ? TESTNET_HOME : "/dashboard";
  redirect(ref ? `${home}?ref=${encodeURIComponent(ref)}` : home);
}
