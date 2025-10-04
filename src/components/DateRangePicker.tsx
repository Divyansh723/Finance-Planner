import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

export function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, 'PP') : 'Start date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={onStartDateChange}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, 'PP') : 'End date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={onEndDateChange}
            initialFocus
            disabled={(date) => startDate ? date < startDate : false}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {(startDate || endDate) && (
        <Button
          variant="ghost"
          onClick={() => {
            onStartDateChange(undefined);
            onEndDateChange(undefined);
          }}
        >
          Clear dates
        </Button>
      )}
    </div>
  );
}
