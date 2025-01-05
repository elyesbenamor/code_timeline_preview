'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const contentVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: { 
      type: "spring",
      duration: 0.5,
      bounce: 0.3
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: i => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3
    }
  }),
  exit: i => ({
    opacity: 0,
    x: -20,
    transition: {
      delay: i * 0.05,
      duration: 0.2
    }
  })
};

export function DiffModal({ isOpen, onClose, segment, darkMode }) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div 
                className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div 
                className={`fixed inset-x-0 mx-auto top-[15vh] z-[9999] w-[90%] max-w-2xl rounded-lg border p-6 shadow-lg -translate-y-1/2
                  ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <Dialog.Title className={`text-lg font-semibold ${
                    darkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    Code Details
                  </Dialog.Title>
                  <Dialog.Close className={`rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Dialog.Close>
                </div>

                {/* Content */}
                <div 
                  className={`mt-4 overflow-y-auto ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  style={{ maxHeight: 'calc(90vh - 200px)' }}
                >
                  {/* Code Information */}
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h4 className="font-medium mb-2">Code Segment</h4>
                      <pre className={`p-4 rounded-lg overflow-x-auto ${
                        darkMode ? 'bg-gray-900' : 'bg-gray-50'
                      }`}>
                        <code>{segment?.text || ''}</code>
                      </pre>
                    </motion.div>

                    {/* Metadata */}
                    <motion.div 
                      className="grid grid-cols-2 gap-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div>
                        <h4 className="font-medium mb-2">Type</h4>
                        <p className={`p-2 rounded ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          {segment?.type || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Complexity</h4>
                        <p className={`p-2 rounded ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          {segment?.complexity?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                    </motion.div>

                    {/* Code Smells */}
                    {segment?.codeSmells?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <h4 className="font-medium mb-2">Code Smells</h4>
                        <ul className={`space-y-2 p-4 rounded-lg ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <AnimatePresence>
                            {segment.codeSmells.map((smell, index) => (
                              <motion.li 
                                key={index}
                                className="flex items-start gap-2"
                                custom={index}
                                variants={listItemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                              >
                                <span className={darkMode ? 'text-yellow-400' : 'text-yellow-600'}>•</span>
                                <span>{smell.message}</span>
                              </motion.li>
                            ))}
                          </AnimatePresence>
                        </ul>
                      </motion.div>
                    )}

                    {/* Context */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <h4 className="font-medium mb-2">Context</h4>
                      <div className={`p-4 rounded-lg ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <p>Line: {segment?.line || 'Unknown'}</p>
                        <p>Position: {segment?.position || 'Unknown'}</p>
                        {segment?.context && (
                          <motion.div 
                            className="mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                          >
                            <p className="mb-1">Surrounding Code:</p>
                            <pre className={`p-2 rounded ${
                              darkMode ? 'bg-gray-900' : 'bg-gray-50'
                            }`}>
                              <code>{segment.context}</code>
                            </pre>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
