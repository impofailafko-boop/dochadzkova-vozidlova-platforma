import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Download, BarChart3 } from 'lucide-react';
import { useFinanceRecords, FinanceRecord } from '@/hooks/useFinanceRecords';
import { useFinanceSheets, ColumnConfig } from '@/hooks/useFinanceSheets';
import { CreateFinanceRecordDialog } from '@/components/admin/CreateFinanceRecordDialog';
import { CreateFinanceSheetDialog } from '@/components/admin/CreateFinanceSheetDialog';
import { FinanceRecordChartDialog } from '@/components/admin/FinanceRecordChartDialog';
import { CellColorPicker } from '@/components/admin/CellColorPicker';
import { EditableCell } from '@/components/admin/EditableCell';
import { EditableSheetName } from '@/components/admin/EditableSheetName';
import { EditableColumnHeader } from '@/components/admin/EditableColumnHeader';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'row_color', name: 'Farba riadku', field: 'row_color', visible: true, width: 'w-[80px]', align: 'left' },
  { id: 'order_number', name: 'Č. objednávky', field: 'order_number', visible: true, width: 'w-[150px]', align: 'left' },
  { id: 'location', name: 'Lokalita', field: 'location', visible: true, align: 'left' },
  { id: 'completion_deadline', name: 'Termín ukončenia', field: 'completion_deadline', visible: true, align: 'left' },
  { id: 'worker', name: 'Pracovník', field: 'worker', visible: true, align: 'left' },
  { id: 'scope_by_order', name: 'Rozsah podľa obj.', field: 'scope_by_order', visible: true, align: 'left' },
  { id: 'total_vsd', name: 'Suma VŠD', field: 'total_vsd', visible: true, align: 'right' },
  { id: 'paid_employees', name: 'Zaplatené', field: 'paid_employees', visible: true, align: 'right' },
  { id: 'profit', name: 'Zisk', field: 'profit', visible: true, align: 'right' },
  { id: 'completion_date', name: 'Dátum ukončenia', field: 'completion_date', visible: true, align: 'left' },
  { id: 'invoice_number', name: 'FA', field: 'invoice_number', visible: true, align: 'left' },
  { id: 'scope_by_invoice', name: 'Rozsah podľa FA', field: 'scope_by_invoice', visible: true, align: 'left' },
  { id: 'actual_scope', name: 'Rozsah reálny', field: 'actual_scope', visible: true, align: 'left' },
  { id: 'by_employee', name: 'Podľa zamestnanca', field: 'by_employee', visible: true, align: 'left' },
  { id: 'notes', name: 'Poznámky', field: 'notes', visible: true, align: 'left' },
  { id: 'chart', name: 'Graf', field: 'chart', visible: true, width: 'w-[80px]', align: 'left' },
  { id: 'actions', name: 'Akcie', field: 'actions', visible: true, width: 'w-[80px]', align: 'left' },
];

export default function Finance() {
  const { user } = useAuth();
  const { sheets, isLoading: isSheetsLoading, createSheet, updateSheet, deleteSheet } = useFinanceSheets();
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const { records, isLoading, deleteRecord, updateRecord } = useFinanceRecords(activeSheetId || undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSheetDialogOpen, setCreateSheetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSheetDialogOpen, setDeleteSheetDialogOpen] = useState(false);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);
  const [selectedRecordForChart, setSelectedRecordForChart] = useState<FinanceRecord | null>(null);

  const activeSheet = sheets.find(s => s.id === activeSheetId);
  const columns = activeSheet?.column_config && activeSheet.column_config.length > 0 
    ? activeSheet.column_config 
    : DEFAULT_COLUMNS;

  const hasAccess = user?.email === 'pikolo@pikolo.sk';

  if (!isSheetsLoading && sheets.length > 0 && !activeSheetId) {
    setActiveSheetId(sheets[0].id);
  }

  useEffect(() => {
    if (activeSheet && (!activeSheet.column_config || activeSheet.column_config.length === 0)) {
      updateSheet({ id: activeSheet.id, column_config: DEFAULT_COLUMNS });
    }
  }, [activeSheet]);

  const handleCreateSheet = async (name: string) => {
    const newSheet = await createSheet({ name });
    await updateSheet({ id: newSheet.id, column_config: DEFAULT_COLUMNS });
    setActiveSheetId(newSheet.id);
  };

  const handleUpdateSheetName = async (sheetId: string, name: string) => {
    await updateSheet({ id: sheetId, name });
  };

  const handleUpdateColumnName = async (columnId: string, newName: string) => {
    if (!activeSheetId) return;
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, name: newName } : col
    );
    await updateSheet({ id: activeSheetId, column_config: updatedColumns });
  };

  const handleAddColumn = async (afterColumnId?: string) => {
    if (!activeSheetId) return;
    const newColumn: ColumnConfig = {
      id: `custom_${Date.now()}`,
      name: 'Nový stĺpec',
      field: `custom_${Date.now()}`,
      visible: true,
      align: 'left',
    };

    let updatedColumns: ColumnConfig[];
    if (afterColumnId) {
      const index = columns.findIndex(col => col.id === afterColumnId);
      updatedColumns = [
        ...columns.slice(0, index + 1),
        newColumn,
        ...columns.slice(index + 1),
      ];
    } else {
      updatedColumns = [...columns.slice(0, -2), newColumn, ...columns.slice(-2)];
    }
    await updateSheet({ id: activeSheetId, column_config: updatedColumns });
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!activeSheetId) return;
    const updatedColumns = columns.filter(col => col.id !== columnId);
    await updateSheet({ id: activeSheetId, column_config: updatedColumns });
  };

  const handleDeleteSheetClick = (sheetId: string) => {
    if (sheets.length <= 1) return;
    setSheetToDelete(sheetId);
    setDeleteSheetDialogOpen(true);
  };

  const handleConfirmDeleteSheet = async () => {
    if (!sheetToDelete) return;
    await deleteSheet(sheetToDelete);
    if (activeSheetId === sheetToDelete && sheets.length > 1) {
      const remainingSheets = sheets.filter(s => s.id !== sheetToDelete);
      setActiveSheetId(remainingSheets[0].id);
    }
    setDeleteSheetDialogOpen(false);
    setSheetToDelete(null);
  };

  const handleRowColorChange = async (recordId: string, color: string) => {
    await updateRecord({ id: recordId, row_color: color });
  };

  const handleCellColorChange = async (recordId: string, cellKey: string, color: string) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return;
    const newCellColors = { ...(record.cell_colors || {}), [cellKey]: color };
    await updateRecord({ id: recordId, cell_colors: newCellColors });
  };

  const handleClearCellColor = async (recordId: string, cellKey: string) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return;
    const newCellColors = { ...(record.cell_colors || {}) };
    delete newCellColors[cellKey];
    await updateRecord({ id: recordId, cell_colors: newCellColors });
  };

  const getCellColor = (record: FinanceRecord, cellKey: string) => {
    return record.cell_colors?.[cellKey];
  };

  const handleUpdateField = async (recordId: string, field: string, value: string) => {
    const updates: any = { id: recordId };
    if (['total_vsd', 'paid_employees', 'profit'].includes(field)) {
      updates[field] = value ? parseFloat(value) : null;
    } else {
      updates[field] = value || null;
    }
    await updateRecord(updates);
  };

  const handleDelete = async () => {
    if (selectedRecordId) {
      await deleteRecord(selectedRecordId);
      setDeleteDialogOpen(false);
      setSelectedRecordId(null);
    }
  };

  const handleOpenChart = (record: FinanceRecord) => {
    setSelectedRecordForChart(record);
    setChartDialogOpen(true);
  };

  const exportToCSV = () => {
    const visibleColumns = columns.filter(col => col.visible && col.id !== 'row_color' && col.id !== 'chart' && col.id !== 'actions');
    const headers = visibleColumns.map(col => col.name);
    
    const csvContent = [
      headers.join(','),
      ...records.map(r => visibleColumns.map(col => {
        const value = (r as any)[col.field];
        return value || '';
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const sheetName = activeSheet?.name || 'export';
    link.download = `financie_${sheetName}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const renderCellContent = (record: FinanceRecord, column: ColumnConfig) => {
    const value = (record as any)[column.field];

    if (column.id === 'row_color') {
      return (
        <CellColorPicker
          currentColor={record.row_color || undefined}
          onColorChange={(color) => handleRowColorChange(record.id, color)}
          onClearColor={() => handleRowColorChange(record.id, '#ffffff')}
        />
      );
    }

    if (column.id === 'chart') {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenChart(record)}
          className="h-8 w-8 p-0"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      );
    }

    if (column.id === 'actions') {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedRecordId(record.id);
            setDeleteDialogOpen(true);
          }}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <div className="relative group">
        <EditableCell
          value={value || ''}
          onSave={(newValue) => handleUpdateField(record.id, column.field, newValue)}
        />
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <CellColorPicker
            currentColor={getCellColor(record, column.field)}
            onColorChange={(color) => handleCellColorChange(record.id, column.field, color)}
            onClearColor={() => handleClearCellColor(record.id, column.field)}
          />
        </div>
      </div>
    );
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Prístup odmietnutý</CardTitle>
            <CardDescription>
              Nemáte oprávnenie na prístup do sekcie Financie.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading || isSheetsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Načítavam...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <div className="flex items-center gap-2 p-4">
          <ScrollArea className="flex-1">
            <div className="flex gap-1">
              {sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-t-md border-b-2 transition-colors ${
                    activeSheetId === sheet.id
                      ? 'bg-accent border-primary'
                      : 'border-transparent hover:bg-accent/50'
                  }`}
                >
                  <EditableSheetName
                    value={sheet.name}
                    onSave={(name) => handleUpdateSheetName(sheet.id, name)}
                  />
                  {!sheet.is_default && sheets.length > 1 && activeSheetId === sheet.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSheetClick(sheet.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <Button onClick={() => setCreateSheetDialogOpen(true)} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nový hárok
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Financie</h1>
              <p className="text-muted-foreground">Prehľad finančných záznamov</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)} disabled={!activeSheetId}>
                <Plus className="w-4 h-4 mr-2" />
                Nový záznam
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Všetky záznamy</CardTitle>
              <CardDescription>Kompletný zoznam finančných záznamov</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {columns.filter(col => col.visible).map((column) => (
                        <TableHead
                          key={column.id}
                          className={`border-r ${column.width || ''} ${column.align === 'right' ? 'text-right' : ''}`}
                        >
                          <EditableColumnHeader
                            value={column.name}
                            onSave={(newName) => handleUpdateColumnName(column.id, newName)}
                            onAddAfter={column.id !== 'actions' ? () => handleAddColumn(column.id) : undefined}
                            onDelete={!['row_color', 'order_number', 'chart', 'actions'].includes(column.id) ? () => handleDeleteColumn(column.id) : undefined}
                            canDelete={!['row_color', 'order_number', 'chart', 'actions'].includes(column.id)}
                          />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record, index) => (
                      <TableRow
                        key={record.id}
                        style={{ backgroundColor: record.row_color || '#ffffff' }}
                        className={index % 2 === 0 ? '' : 'bg-muted/20'}
                      >
                        {columns.filter(col => col.visible).map((column) => (
                          <TableCell
                            key={column.id}
                            className={`border-r ${column.align === 'right' ? 'text-right' : ''}`}
                            style={
                              column.id !== 'row_color' && column.id !== 'chart' && column.id !== 'actions'
                                ? { backgroundColor: getCellColor(record, column.field) }
                                : undefined
                            }
                          >
                            {renderCellContent(record, column)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateFinanceRecordDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        sheetId={activeSheetId || ''}
      />

      <CreateFinanceSheetDialog
        open={createSheetDialogOpen}
        onOpenChange={setCreateSheetDialogOpen}
        onSubmit={handleCreateSheet}
      />

      {selectedRecordForChart && (
        <FinanceRecordChartDialog
          open={chartDialogOpen}
          onOpenChange={setChartDialogOpen}
          record={selectedRecordForChart}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Naozaj chcete vymazať tento záznam?</AlertDialogTitle>
            <AlertDialogDescription>
              Táto akcia je nenávratná. Záznam bude natrvalo odstránený.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Vymazať</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteSheetDialogOpen} onOpenChange={setDeleteSheetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vymazať hárok?</AlertDialogTitle>
            <AlertDialogDescription>
              Táto akcia natrvalo vymaže hárok vrátane všetkých jeho záznamov.
              {sheetToDelete && (
                <span className="block mt-2 font-medium">
                  Hárok: {sheets.find(s => s.id === sheetToDelete)?.name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteSheet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Vymazať hárok
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
