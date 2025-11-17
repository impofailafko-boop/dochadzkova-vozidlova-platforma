import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface EditableColumnHeaderProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  onDelete?: () => void;
  onAddBefore?: () => void;
  onAddAfter?: () => void;
  canDelete?: boolean;
  className?: string;
}

export function EditableColumnHeader({
  value,
  onSave,
  onDelete,
  onAddBefore,
  onAddAfter,
  canDelete = false,
  className = '',
}: EditableColumnHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue.trim() && editValue !== value) {
      setIsSaving(true);
      await onSave(editValue.trim());
      setIsSaving(false);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className="h-7 text-sm"
          autoFocus
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  const content = (
    <span
      className={`cursor-pointer hover:underline ${className}`}
      onClick={() => setIsEditing(true)}
      title="Kliknite pre úpravu"
    >
      {value}
    </span>
  );

  if (onAddBefore || onAddAfter || (canDelete && onDelete)) {
    return (
      <ContextMenu>
        <ContextMenuTrigger>{content}</ContextMenuTrigger>
        <ContextMenuContent>
          {onAddBefore && (
            <ContextMenuItem onClick={onAddBefore}>
              <Plus className="h-4 w-4 mr-2" />
              Pridať stĺpec doľava
            </ContextMenuItem>
          )}
          {onAddAfter && (
            <ContextMenuItem onClick={onAddAfter}>
              <Plus className="h-4 w-4 mr-2" />
              Pridať stĺpec doprava
            </ContextMenuItem>
          )}
          {canDelete && onDelete && (
            <ContextMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Odstrániť stĺpec
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return content;
}
