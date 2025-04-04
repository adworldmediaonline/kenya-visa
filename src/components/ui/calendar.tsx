'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, useNavigation } from 'react-day-picker';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { ScrollArea } from './scroll-area';

// Create a custom caption component for DOB selection
function DobCaption({ displayMonth }: { displayMonth: Date }) {
  const { goToMonth } = useNavigation();
  const currentYear = displayMonth.getFullYear();
  const currentMonth = displayMonth.getMonth();

  // Generate years (100 years in the past from current year)
  const currentDate = new Date();
  const thisYear = currentDate.getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => thisYear - i);

  const months = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' },
  ];

  return (
    <div className="flex justify-center items-center gap-2">
      <Select
        value={currentMonth.toString()}
        onValueChange={value => {
          const newDate = new Date(displayMonth);
          newDate.setMonth(parseInt(value));
          goToMonth(newDate);
        }}
      >
        <SelectTrigger className="w-[130px] h-8">
          <SelectValue>{format(displayMonth, 'MMMM')}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {months.map(month => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentYear.toString()}
        onValueChange={value => {
          const newDate = new Date(displayMonth);
          newDate.setFullYear(parseInt(value));
          goToMonth(newDate);
        }}
      >
        <SelectTrigger className="w-[100px] h-8">
          <SelectValue>{currentYear}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-80">
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}

// Create a custom caption component for passport expiry date selection
function PassportExpiryCaption({ displayMonth }: { displayMonth: Date }) {
  const { goToMonth } = useNavigation();
  const currentYear = displayMonth.getFullYear();
  const currentMonth = displayMonth.getMonth();

  // Generate future years (next 20 years from current year)
  const currentDate = new Date();
  const thisYear = currentDate.getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => thisYear + i);

  const months = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' },
  ];

  return (
    <div className="flex justify-center items-center gap-2">
      <Select
        value={currentMonth.toString()}
        onValueChange={value => {
          const newDate = new Date(displayMonth);
          newDate.setMonth(parseInt(value));
          goToMonth(newDate);
        }}
      >
        <SelectTrigger className="w-[130px] h-8">
          <SelectValue>{format(displayMonth, 'MMMM')}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {months.map(month => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentYear.toString()}
        onValueChange={value => {
          const newDate = new Date(displayMonth);
          newDate.setFullYear(parseInt(value));
          goToMonth(newDate);
        }}
      >
        <SelectTrigger className="w-[100px] h-8">
          <SelectValue>{currentYear}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-80">
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  variant?: 'default' | 'dob' | 'passport-expiry';
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  variant = 'default',
  ...props
}: CalendarProps) {
  // Add default from/to props for passport-expiry variant
  if (variant === 'passport-expiry' && !props.disabled) {
    // Calculate min date: today + 6 months
    const today = new Date();
    const sixMonthsLater = new Date(today);
    sixMonthsLater.setMonth(today.getMonth() + 6);

    // Set min date to 6 months from now
    props.disabled = (date: Date) => date < sixMonthsLater;

    // Default to showing current month + 6 months
    if (!props.defaultMonth) {
      props.defaultMonth = sixMonthsLater;
    }
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        caption: cn(
          'flex justify-center pt-1 relative items-center w-full',
          (variant === 'dob' || variant === 'passport-expiry') && 'relative h-9'
        ),
        caption_label: cn(
          'text-sm font-medium',
          (variant === 'dob' || variant === 'passport-expiry') && 'hidden'
        ),
        nav: cn(
          'flex items-center gap-1',
          (variant === 'dob' || variant === 'passport-expiry') && 'hidden'
        ),
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-x-1',
        head_row: 'flex',
        head_cell:
          'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_start:
          'day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground',
        day_range_end:
          'day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground aria-selected:text-muted-foreground',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn('size-4', className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn('size-4', className)} {...props} />
        ),
        Caption:
          variant === 'dob'
            ? DobCaption
            : variant === 'passport-expiry'
            ? PassportExpiryCaption
            : undefined,
      }}
      {...props}
    />
  );
}

export { Calendar };
