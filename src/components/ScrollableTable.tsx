import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScrollableTableProps {
  children: React.ReactNode;
  maxHeight?: string;
  maxItems?: number;
}

export function ScrollableTable({ 
  children, 
  maxHeight = "400px",
  maxItems = 5
}: ScrollableTableProps) {
  return (
    <ScrollArea 
      className="rounded-md border" 
      style={{ maxHeight }}
    >
      <div className="max-h-full">
        {children}
      </div>
    </ScrollArea>
  );
}

interface ScrollableTableContainerProps {
  headers: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingColSpan?: number;
}

export function ScrollableTableContainer({
  headers,
  children,
  maxHeight = "400px",
  emptyMessage = "No data available",
  isLoading = false,
  loadingColSpan = 3
}: ScrollableTableContainerProps) {
  return (
    <ScrollArea className="rounded-md border" style={{ maxHeight }}>
      <Table>
        <TableHeader>
          {headers}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={loadingColSpan} className="text-center py-6">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            children
          )}
          {!isLoading && React.Children.count(children) === 0 && (
            <TableRow>
              <TableCell colSpan={loadingColSpan} className="text-center py-6 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}