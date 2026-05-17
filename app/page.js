import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import Workbook from "@/components/Workbook";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();

  return <Workbook initialData={row?.data ?? null} userEmail={user.email} />;
}
