"use client"

import { useAccount } from "wagmi"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { ProjectsSection } from "@/components/dashboard/ProjectsSection"
import { DonationsSection } from "@/components/dashboard/DonationsSection"
import { ProfileSection } from "@/components/dashboard/ProfileSection"

export default function DashboardPage() {
  const { isConnected } = useAccount()

  if (!isConnected) return null

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-white text-black">
      <main className="w-full max-w-2xl px-6 space-y-16 py-32">
        <h1 className="text-4xl font-semibold tracking-tight text-center">dashboard</h1>
        <ProfileSection />
        <StatsGrid />
        <DonationsSection />
        <ProjectsSection />
      </main>
    </div>
  )
}


