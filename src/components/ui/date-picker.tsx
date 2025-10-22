import * as React from "react";
import { format } from "date-fns";
import { sk } from "date-fns/locale/sk";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disableFuture?: boolean;
  disablePast?: boolean;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Vyberte dátum",
  disabled = false,
  disableFuture = false,
  disablePast = false,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd.MM.yyyy", { locale: sk }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (disableFuture && date > today) return true;
            if (disablePast && date < today) return true;
            return false;
          }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
          locale={sk}
        />
      </PopoverContent>
    </Popover>
  );
}
