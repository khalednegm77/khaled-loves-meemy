import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// TEMPORARY diagnostic route — reproduces the exact insert the Save button makes.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const report: Record<string, unknown> = {
    urlPresent: Boolean(url),
    urlHost: url ? new URL(url).host : null,
    anonKeyPresent: Boolean(key),
  }

  if (!url || !key) {
    return NextResponse.json({ ...report, note: "Missing env vars in server runtime" })
  }

  const supabase = createClient(url, key)

  // Read existing count
  const sel = await supabase.from("safe_place_pages").select("*")
  report.selectError = sel.error
    ? { message: sel.error.message, code: sel.error.code, details: sel.error.details, hint: sel.error.hint }
    : null
  report.existingRowCount = sel.data?.length ?? null

  // Attempt the same insert shape the app uses
  const now = new Date().toISOString()
  const ins = await supabase
    .from("safe_place_pages")
    .insert({
      id: crypto.randomUUID(),
      user_id: "00000000-0000-0000-0000-000000000000",
      writer_name: "diagnostic",
      message: "diagnostic insert from _debug_insert",
      emotion: "neutral",
      severity: 1,
      needs: [],
      created_at: now,
      updated_at: now,
      status: "Waiting for Reply",
      favorite: false,
      resolved: false,
      conversation: [],
    })
    .select()

  report.insertError = ins.error
    ? { message: ins.error.message, code: ins.error.code, details: ins.error.details, hint: ins.error.hint }
    : null
  report.insertData = ins.data

  return NextResponse.json(report)
}
