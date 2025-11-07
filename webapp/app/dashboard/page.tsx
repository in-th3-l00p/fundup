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
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-center">fundup app</h1>
          <p className="text-sm text-zinc-600">welcome to the fundup app, quick access:</p>
          <div className="flex gap-6 items-center justify-center text-zinc-600">
            <a href="#profile" className="hover:text-violet-900 transition-colors">profile</a>
            <div>✧</div>
            <a href="#stats" className="hover:text-violet-900 transition-colors">stats</a>
            <div>✧</div>
            <a href="#donations" className="hover:text-violet-900 transition-colors">donations</a>
            <div>✧</div>
            <a href="#projects" className="hover:text-violet-900 transition-colors">projects</a>
          </div>
        </div>
        <ProfileSection />
        <StatsGrid />
        <DonationsSection />
        <ProjectsSection />
      </main>
    </div>
  )
}


