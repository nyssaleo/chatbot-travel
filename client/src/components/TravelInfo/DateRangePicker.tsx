import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  onDatesSelected: (startDate: Date, endDate: Date) => void;
  className?: string;
  defaultValue?: DateRange;
  placeholder?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  onDatesSelected,
  className,
  defaultValue,
  placeholder = 'Select dates',
  disabled = false,
}: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      onDatesSelected(range.from, range.to);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'PPP')} - {format(date.to, 'PPP')}
                </>
              ) : (
                format(date.from, 'PPP')
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={(date) => date < new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}