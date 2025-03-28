"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { User, Bell, Shield, Palette, Save, Trash2, LogOut } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FormState {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    updates: boolean;
    newsletter: boolean;
  };
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, isLoaded } = useUser()
  const { toast } = useToast()
  
  const [formState, setFormState] = useState<FormState>({
    theme: "light",
    notifications: {
      email: true,
      push: false,
      updates: true,
      newsletter: false,
    },
  })

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNotificationChange = (field: keyof FormState['notifications'], value: boolean) => {
    setFormState((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }))
  }

  const handleProfileUpdate = async () => {
    try {
      await user?.update({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
      })
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await user?.delete()
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!isLoaded) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="mb-6">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={user?.imageUrl} 
                  alt={user?.fullName || "Profile"} 
                  className="w-20 h-20 rounded-full"
                />
                <div>
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                  <p className="text-sm text-gray-600">Update your profile information and email settings</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={user?.fullName || ""} 
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.primaryEmailAddress?.emailAddress || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="english">
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="bg-gray-900 text-white hover:bg-gray-800"
                onClick={handleProfileUpdate}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>

              <Separator />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
                <p className="text-gray-600">Once you delete your account, there is no going back. Please be certain.</p>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={formState.notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-gray-600">Receive notifications on your device</p>
                  </div>
                  <Switch
                    checked={formState.notifications.push}
                    onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Product Updates</h3>
                    <p className="text-sm text-gray-600">Receive updates about new features</p>
                  </div>
                  <Switch
                    checked={formState.notifications.updates}
                    onCheckedChange={(checked) => handleNotificationChange("updates", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Newsletter</h3>
                    <p className="text-sm text-gray-600">Receive our monthly newsletter</p>
                  </div>
                  <Switch
                    checked={formState.notifications.newsletter}
                    onCheckedChange={(checked) => handleNotificationChange("newsletter", checked)}
                  />
                </div>
              </div>

              <Button className="bg-gray-900 text-white hover:bg-gray-800">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Theme Settings</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={formState.theme} onValueChange={(value) => handleInputChange("theme", value)}>
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer ${
                      formState.theme === "light" ? "border-gray-900" : "border-gray-200"
                    }`}
                    onClick={() => handleInputChange("theme", "light")}
                  >
                    <div className="h-24 bg-white border border-gray-200 rounded-md mb-2"></div>
                    <p className="text-sm font-medium text-center">Light</p>
                  </div>

                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer ${
                      formState.theme === "dark" ? "border-gray-900" : "border-gray-200"
                    }`}
                    onClick={() => handleInputChange("theme", "dark")}
                  >
                    <div className="h-24 bg-gray-900 border border-gray-700 rounded-md mb-2"></div>
                    <p className="text-sm font-medium text-center">Dark</p>
                  </div>

                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer ${
                      formState.theme === "system" ? "border-gray-900" : "border-gray-200"
                    }`}
                    onClick={() => handleInputChange("theme", "system")}
                  >
                    <div className="h-24 bg-gradient-to-r from-white to-gray-900 border border-gray-200 rounded-md mb-2"></div>
                    <p className="text-sm font-medium text-center">System</p>
                  </div>
                </div>
              </div>

              <Button className="bg-gray-900 text-white hover:bg-gray-800">
                <Save className="h-4 w-4 mr-2" />
                Save Theme
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Password</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>

              <Button className="bg-gray-900 text-white hover:bg-gray-800">
                <Save className="h-4 w-4 mr-2" />
                Update Password
              </Button>

              <Separator />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Sessions</h2>
                <p className="text-gray-600">This will log you out of all devices except your current one.</p>
                <Button variant="outline">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out of All Devices
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 