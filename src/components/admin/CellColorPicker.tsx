import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Palette, X } from 'lucide-react';

interface CellColorPickerProps {
  currentColor?: string;
  onColorChange: (color: string) => void;
  onClearColor: () => void;
}

const PRESET_COLORS = [
  '#ffffff', // White
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f3f4f6', // Gray light
  '#9ca3af', // Gray
];

export function CellColorPicker({ currentColor, onColorChange, onClearColor }: CellColorPickerProps) {
  const [customColor, setCustomColor] = useState(currentColor || '#ffffff');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-background border shadow-lg z-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Farba bunky</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClearColor}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Preset colors grid */}
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className="h-8 w-8 rounded border-2 hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: color,
                  borderColor: currentColor === color ? '#000' : '#d1d5db'
                }}
                onClick={() => onColorChange(color)}
              />
            ))}
          </div>

          {/* Custom color picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Vlastná farba</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-10 w-full rounded cursor-pointer"
              />
              <Button
                size="sm"
                onClick={() => onColorChange(customColor)}
              >
                Použiť
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
