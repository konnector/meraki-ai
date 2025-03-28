"use client"

import * as React from "react"
import {
  Settings,
  LogOut,
  User,
  Bell,
  CreditCard,
  Plus,
  Trash2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { SettingsModal } from "./settings-modal"
import { CreateFolderModal } from "./create-folder-modal"
import { FoldersSection } from "./folders-section"
import { TagsSection } from "./tags-section"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)

  return (
    <>
      <Sidebar collapsible="icon" className="bg-[#FAFAFA]" {...props}>
        <SidebarHeader>
          <div className="flex flex-col items-center justify-center gap-2 p-2">
            <div className="flex items-center gap-2 px-2">
              <img 
                src="/sava.png" 
                alt="Sava Logo" 
                className="w-6 h-6 -mt-1"
              />
              <h4 className="scroll-m-20 tracking-tight text-2xl font-calsans text-center">
                Meraki AI
              </h4>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <div className="transition-all duration-200 mx-4">
            <h3 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
              Folders
            </h3>
            <FoldersSection />
            
            <button 
              className="inline-flex items-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full justify-start mt-2"
              onClick={() => setCreateFolderOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create new folder
            </button>

            <h3 className="mt-6 mb-2 px-2 text-sm font-semibold text-muted-foreground">
              Tags
            </h3>
            <TagsSection />
          </div>
        </SidebarContent>

        <SidebarFooter>
          <div className="mx-4 mb-4">
            <button 
              className="inline-flex items-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 h-9 rounded-md px-3 w-full justify-start"
              onClick={() => router.push('/dashboard?trash=true')}
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Trash
            </button>
          </div>

          <div className="w-62 flex items-center gap-2 rounded-[12px] border bg-card text-card-foreground shadow-sm mb-6 mx-2 p-3">
            <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
              <img 
                className="aspect-square h-full w-full" 
                src={user?.imageUrl} 
                alt={user?.fullName || 'User avatar'}
              />
            </span>
            <div className="flex flex-col flex-1 min-w-0">
              <small className="text-sm font-medium leading-none truncate">
                <b>{user?.fullName}</b>
              </small>
              <small className="font-medium text-muted-foreground text-xs truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </small>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSettingsOpen(true)}
                className="active:scale-110 transition-all duration-100"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SettingsModal 
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      
      <CreateFolderModal
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
      />
    </>
  )
}
