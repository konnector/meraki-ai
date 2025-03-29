import { Button } from "@/components/ui/button"
import {
  Import,
  FileDown,
  FilePlus,
  Settings,
  X
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSpreadsheet } from "@/context/spreadsheet-context"
import { useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

export function EnhancedImportExportButtons() {
  const { 
    cells, 
    title, 
    importData,
    exportData,
    selection,
  } = useSpreadsheet()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importOptions, setImportOptions] = useState({
    clearExisting: false,
    startCell: 'A1',
    showDialog: false,
    manualInput: false,
    csvContent: '',
  })
  
  const [exportOptions, setExportOptions] = useState({
    includeFormatting: false,
    onlySelection: false,
    fileType: 'csv' as 'csv' | 'json',
    showDialog: false,
  })
  
  // Handle file selection for import
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Process the selected CSV file
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (!content) return
      
      // Show the import dialog with options
      setImportOptions({
        ...importOptions,
        showDialog: true,
        csvContent: content,
      })
    }
    
    reader.readAsText(file)
    
    // Reset the file input
    event.target.value = ''
  }
  
  // Handle import with current options
  const handleImport = () => {
    if (importOptions.manualInput) {
      // Use the manually entered CSV content
      importData(importOptions.csvContent, {
        clearExisting: importOptions.clearExisting,
        startCell: importOptions.startCell,
      })
    } else if (importOptions.csvContent) {
      // Use the file content
      importData(importOptions.csvContent, {
        clearExisting: importOptions.clearExisting,
        startCell: importOptions.startCell,
      })
    }
    
    // Reset options and close dialog
    setImportOptions({
      ...importOptions,
      showDialog: false,
    })
  }
  
  // Handle export with current options
  const handleExport = () => {
    // Close dialog
    setExportOptions({
      ...exportOptions,
      showDialog: false,
    })
    
    // Generate the export content
    const content = exportData({
      includeFormatting: exportOptions.includeFormatting,
      onlySelection: exportOptions.onlySelection,
      fileType: exportOptions.fileType,
    })
    
    if (!content) {
      alert('No data to export!')
      return
    }
    
    // Create file for download
    const fileType = exportOptions.fileType === 'csv' ? 'text/csv' : 'application/json'
    const extension = exportOptions.fileType
    const fileName = `${title || 'spreadsheet'}.${extension}`
    
    const blob = new Blob([content], { type: `${fileType};charset=utf-8;` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Import Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <Import className="h-4 w-4 mr-1" />
              Import
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleFileSelect}>
              <FilePlus className="h-4 w-4 mr-2" />
              Import from CSV File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportOptions({
              ...importOptions,
              showDialog: true,
              manualInput: true,
              csvContent: '',
            })}>
              <Settings className="h-4 w-4 mr-2" />
              Paste CSV Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Export Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <FileDown className="h-4 w-4 mr-1" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => {
              setExportOptions({
                ...exportOptions,
                fileType: 'csv',
                showDialog: true,
              })
            }}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setExportOptions({
                ...exportOptions,
                fileType: 'json',
                showDialog: true,
              })
            }}>
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              // Quick export with default options
              const content = exportData({ fileType: 'csv' })
              if (!content) {
                alert('No data to export!')
                return
              }
              
              const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              
              link.setAttribute('href', url)
              link.setAttribute('download', `${title || 'spreadsheet'}.csv`)
              link.style.visibility = 'hidden'
              
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}>
              Quick Export (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Hidden file input for CSV import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        
        {/* Import Dialog */}
        {importOptions.showDialog && (
          <Dialog open={importOptions.showDialog} onOpenChange={(open) => {
            setImportOptions({ ...importOptions, showDialog: open })
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Options</DialogTitle>
                <DialogDescription>
                  Configure how you want to import your data
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {importOptions.manualInput && (
                  <div className="grid gap-2">
                    <Label htmlFor="csvContent">Paste CSV Content</Label>
                    <Textarea
                      id="csvContent"
                      placeholder="Paste your CSV data here..."
                      value={importOptions.csvContent}
                      onChange={(e) => setImportOptions({
                        ...importOptions,
                        csvContent: e.target.value,
                      })}
                      className="h-32"
                    />
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="startCell">Start Cell</Label>
                  <Input
                    id="startCell"
                    value={importOptions.startCell}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      startCell: e.target.value.toUpperCase(),
                    })}
                    placeholder="A1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="clearExisting"
                    checked={importOptions.clearExisting}
                    onCheckedChange={(checked) => setImportOptions({
                      ...importOptions,
                      clearExisting: checked === true,
                    })}
                  />
                  <Label htmlFor="clearExisting">Clear existing data before import</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportOptions({
                  ...importOptions,
                  showDialog: false,
                })}>
                  Cancel
                </Button>
                <Button onClick={handleImport}>Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Export Dialog */}
        {exportOptions.showDialog && (
          <Dialog open={exportOptions.showDialog} onOpenChange={(open) => {
            setExportOptions({ ...exportOptions, showDialog: open })
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Options</DialogTitle>
                <DialogDescription>
                  Configure how you want to export your data
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeFormatting"
                    checked={exportOptions.includeFormatting}
                    onCheckedChange={(checked) => setExportOptions({
                      ...exportOptions,
                      includeFormatting: checked === true,
                    })}
                  />
                  <Label htmlFor="includeFormatting">
                    {exportOptions.fileType === 'csv'
                      ? 'Export formulas instead of values'
                      : 'Include cell formatting'}
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onlySelection"
                    checked={exportOptions.onlySelection}
                    disabled={!selection}
                    onCheckedChange={(checked) => setExportOptions({
                      ...exportOptions,
                      onlySelection: checked === true,
                    })}
                  />
                  <Label htmlFor="onlySelection" className={!selection ? 'text-gray-400' : ''}>
                    Only export selected cells {!selection && '(No selection)'}
                  </Label>
                </div>
                
                <div className="grid gap-2">
                  <Label>File Format</Label>
                  <RadioGroup
                    value={exportOptions.fileType}
                    onValueChange={(value) => setExportOptions({
                      ...exportOptions,
                      fileType: value as 'csv' | 'json',
                    })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="csv" id="csv" />
                      <Label htmlFor="csv">CSV (.csv)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="json" id="json" />
                      <Label htmlFor="json">JSON (.json)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setExportOptions({
                  ...exportOptions,
                  showDialog: false,
                })}>
                  Cancel
                </Button>
                <Button onClick={handleExport}>Export</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  )
}