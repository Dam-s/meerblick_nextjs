import { supabase } from "@/lib/supabaseClient";

export default async function Instruments() {
  const { data: chambres } = await supabase.from("chambre").select();

  return <pre>{JSON.stringify(chambres, null, 2)}</pre>
}