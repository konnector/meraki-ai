import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import type { Spreadsheet } from "@/lib/supabase/types";
import { motion, AnimatePresence } from "framer-motion";

interface UISpreadsheet extends Spreadsheet {
  _deleted?: boolean;
}

interface RecentSpreadsheetsProps {
  spreadsheets: UISpreadsheet[];
  onUpdate: (updatedSheet: UISpreadsheet) => void;
  SpreadsheetCard: React.ComponentType<{ sheet: UISpreadsheet; onUpdate: (updatedSheet: UISpreadsheet) => void }>;
}

// Spread some of the motion styles to wrapper components
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function RecentSpreadsheets({ spreadsheets, onUpdate, SpreadsheetCard }: RecentSpreadsheetsProps) {
  const [layout, setLayout] = useState<'grid' | 'list' | 'scroll'>('grid');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(spreadsheets.length / itemsPerPage);

  // Reset pagination when spreadsheets change
  useEffect(() => {
    setCurrentPage(0);
  }, [spreadsheets.length]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  // Get current items to display
  const getCurrentItems = () => {
    const startIndex = currentPage * itemsPerPage;
    return spreadsheets.slice(startIndex, startIndex + itemsPerPage);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <h3 className="text-xl font-semibold text-gray-900">Recent</h3>
          {spreadsheets.length > 0 && (
            <span className="inline-flex h-5 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-medium text-gray-600">
              {spreadsheets.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={layout === 'grid' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setLayout('grid')}
            className="h-8 px-3"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={layout === 'list' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setLayout('list')}
            className="h-8 px-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </Button>
          <Button 
            variant={layout === 'scroll' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setLayout('scroll')}
            className="h-8 px-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <polyline points="15 6 21 12 15 18"></polyline>
            </svg>
          </Button>
        </div>
      </div>
      
      {layout === 'grid' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 relative">
          {spreadsheets.map((sheet) => (
            <div className="transition-all hover:translate-y-[-2px] duration-200" key={sheet.id}>
              <SpreadsheetCard 
                key={sheet.id} 
                sheet={sheet} 
                onUpdate={onUpdate}
              />
            </div>
          ))}
          {spreadsheets.length === 0 && (
            <p className="text-gray-500 col-span-full">No spreadsheets yet</p>
          )}
        </div>
      )}
      
      {layout === 'list' && (
        <div className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {spreadsheets.map((sheet) => (
            <div 
              className="w-full bg-white hover:bg-gray-50 transition-colors" 
              key={sheet.id}
            >
              <div className="px-4 py-3">
                <SpreadsheetCard 
                  sheet={sheet} 
                  onUpdate={onUpdate}
                />
              </div>
            </div>
          ))}
          {spreadsheets.length === 0 && (
            <p className="text-gray-500 p-4">No spreadsheets yet</p>
          )}
        </div>
      )}
      
      {layout === 'scroll' && (
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 relative min-h-[260px]"
            >
              {getCurrentItems().map((sheet, index) => (
                <motion.div 
                  className="transition-all hover:translate-y-[-2px] duration-200" 
                  key={sheet.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                    <SpreadsheetCard 
                      sheet={sheet} 
                      onUpdate={onUpdate}
                    />
                  </div>
                </motion.div>
              ))}
              {spreadsheets.length === 0 && (
                <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500 mb-2">No spreadsheets yet</p>
                  <p className="text-sm text-gray-400">Create a new spreadsheet to get started</p>
                </div>
              )}
              {getCurrentItems().length < itemsPerPage && spreadsheets.length > 0 && Array.from({ length: itemsPerPage - getCurrentItems().length }).map((_, index) => (
                <div key={`empty-${index}`} className="h-0 md:h-auto"></div>
              ))}
            </motion.div>
          </AnimatePresence>
          
          {spreadsheets.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-9 px-4 border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                      i === currentPage 
                        ? 'bg-gray-800 scale-110' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    onClick={() => setCurrentPage(i)}
                    aria-label={`Go to page ${i + 1}`}
                  ></button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-9 px-4 border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          
          <div className="text-center text-xs text-gray-500 mt-2">
            {spreadsheets.length > 0 && (
              <span>
                Showing {currentPage * itemsPerPage + 1} - {Math.min((currentPage + 1) * itemsPerPage, spreadsheets.length)} of {spreadsheets.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 