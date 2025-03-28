"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Keyboard } from "lucide-react"

export default function KeyboardShortcutsHelp() {
  const shortcuts = [
    { keys: ["Ctrl", "C"], description: "Copy selected cells" },
    { keys: ["Ctrl", "X"], description: "Cut selected cells" },
    { keys: ["Ctrl", "V"], description: "Paste from clipboard" },
    { keys: ["Delete"], description: "Clear selected cells" },
    { keys: ["Ctrl", "A"], description: "Select all cells" },
    { keys: ["Shift", "Arrow Keys"], description: "Extend selection" },
    { keys: ["Enter"], description: "Edit active cell / Confirm edit" },
    { keys: ["Escape"], description: "Cancel editing" },
    { keys: ["Arrow Keys"], description: "Navigate between cells" },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Keyboard Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Use these keyboard shortcuts to work more efficiently.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span
                    key={keyIndex}
                    className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded border border-gray-200"
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

