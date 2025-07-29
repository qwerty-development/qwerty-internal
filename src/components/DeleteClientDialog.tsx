"use client";

import { useState } from "react";
import {
  Trash2,
  AlertTriangle,
  FileText,
  Receipt,
  MessageSquare,
  File,
} from "lucide-react";

interface DeletionSummary {
  client: any;
  tickets: number;
  invoices: number;
  receipts: number;
  quotations: number;
  updates: number;
  files: string[];
}

interface DeleteClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summary: DeletionSummary | null;
  loading: boolean;
}

export default function DeleteClientDialog({
  isOpen,
  onClose,
  onConfirm,
  summary,
  loading,
}: DeleteClientDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center p-6 border-b border-gray-200">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Client
            </h3>
            <p className="text-sm text-gray-500">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {summary ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete{" "}
                  <strong>{summary.client.name}</strong>? This will permanently
                  remove all associated data.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  The following will be deleted:
                </h4>

                <div className="space-y-2">
                  {summary.tickets > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                      <span>
                        {summary.tickets} ticket
                        {summary.tickets !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {summary.invoices > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Receipt className="w-4 h-4 mr-2 text-green-500" />
                      <span>
                        {summary.invoices} invoice
                        {summary.invoices !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {summary.receipts > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2 text-purple-500" />
                      <span>
                        {summary.receipts} receipt
                        {summary.receipts !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {summary.quotations > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2 text-yellow-500" />
                      <span>
                        {summary.quotations} quotation
                        {summary.quotations !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {summary.updates > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4 mr-2 text-orange-500" />
                      <span>
                        {summary.updates} update
                        {summary.updates !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {summary.files.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <File className="w-4 h-4 mr-2 text-gray-500" />
                      <span>
                        {summary.files.length} uploaded file
                        {summary.files.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs text-gray-600">
                    <strong>Note:</strong> This will also delete the client's
                    user account and remove them from the authentication system.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">
                Loading deletion summary...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !summary}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Client
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
