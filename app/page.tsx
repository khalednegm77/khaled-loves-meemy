"use client"

import { AuthProvider } from "@/components/auth-context"
import { ContentProvider } from "@/components/content-context"
import { AppWrapper } from "@/components/app-wrapper"

export default function Page() {
  return (
    <AuthProvider>
      <ContentProvider>
        <AppWrapper />
      </ContentProvider>
    </AuthProvider>
  )
}
