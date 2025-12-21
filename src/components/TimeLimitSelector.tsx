import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Clock, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { format, addMinutes, addHours, addDays, addWeeks, addMonths, isAfter, isBefore } from 'date-fns';

interface TimeLimitSelectorProps {
  value?: Date;
  onChange: (date: Date | null) => void;
  className?: string;
}

const TimeLimitSelector: React.FC<TimeLimitSelectorProps> = ({
  value,
  onChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeType, setTimeType] = useState<'quick' | 'custom'>('quick');
  const [quickTime, setQuickTime] = useState<string>('1hour');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [customDuration, setCustomDuration] = useState<string>('1');
  const [customDurationType, setCustomDurationType] = useState<string>('hours');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const quickOptions = [
    { value: '5min', label: '5 minutes', icon: '', color: 'text-red-600' },
    { value: '15min', label: '15 minutes', icon: '', color: 'text-orange-600' },
    { value: '30min', label: '30 minutes', icon: '', color: 'text-yellow-600' },
    { value: '1hour', label: '1 hour', icon: '', color: 'text-blue-600' },
    { value: '2hours', label: '2 hours', icon: '', color: 'text-indigo-600' },
    { value: '6hours', label: '6 hours', icon: '', color: 'text-purple-600' },
    { value: '12hours', label: '12 hours', icon: '', color: 'text-pink-600' },
    { value: '1day', label: '1 day', icon: '', color: 'text-green-600' },
    { value: '3days', label: '3 days', icon: '', color: 'text-emerald-600' },
    { value: '1week', label: '1 week', icon: '', color: 'text-teal-600' },
    { value: '2weeks', label: '2 weeks', icon: '', color: 'text-cyan-600' },
    { value: '1month', label: '1 month', icon: '', color: 'text-sky-600' },
  ];

  const durationTypes = [
    { value: 'minutes', label: 'Minutes', max: 59 },
    { value: 'hours', label: 'Hours', max: 23 },
    { value: 'days', label: 'Days', max: 30 },
    { value: 'weeks', label: 'Weeks', max: 12 },
    { value: 'months', label: 'Months', max: 12 },
  ];

  // Sync quickTime with value when value changes externally
  useEffect(() => {
    if (value) {
      const now = new Date();
      const diffMs = value.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      
      // Try to match with quick options
      if (Math.abs(diffMinutes - 5) < 2) setQuickTime('5min');
      else if (Math.abs(diffMinutes - 15) < 2) setQuickTime('15min');
      else if (Math.abs(diffMinutes - 30) < 2) setQuickTime('30min');
      else if (Math.abs(diffHours - 1) < 0.5) setQuickTime('1hour');
      else if (Math.abs(diffHours - 2) < 0.5) setQuickTime('2hours');
      else if (Math.abs(diffHours - 6) < 0.5) setQuickTime('6hours');
      else if (Math.abs(diffHours - 12) < 0.5) setQuickTime('12hours');
      else if (Math.abs(diffDays - 1) < 0.5) setQuickTime('1day');
      else if (Math.abs(diffDays - 3) < 0.5) setQuickTime('3days');
      else if (Math.abs(diffWeeks - 1) < 0.5) setQuickTime('1week');
      else if (Math.abs(diffWeeks - 2) < 0.5) setQuickTime('2weeks');
      else if (Math.abs(diffMonths - 1) < 0.5) setQuickTime('1month');
    }
  }, [value]);

  // Sync calendar month when popover opens or customDate changes
  useEffect(() => {
    if (isOpen && timeType === 'custom') {
      if (customDate) {
        setCalendarMonth(customDate);
      } else {
        setCalendarMonth(new Date());
      }
    }
  }, [isOpen, timeType, customDate]);

  const handleQuickSelect = (option: string) => {
    setQuickTime(option);
    setTimeType('quick');
    const now = new Date();
    let deadline: Date;
    
    switch (option) {
        case '5min':
        deadline = addMinutes(now, 5);
        break;
        case '15min':
        deadline = addMinutes(now, 15);
        break;
        case '30min':
        deadline = addMinutes(now, 30);
        break;
        case '1hour':
        deadline = addHours(now, 1);
        break;
        case '2hours':
        deadline = addHours(now, 2);
        break;
        case '6hours':
        deadline = addHours(now, 6);
        break;
        case '12hours':
        deadline = addHours(now, 12);
        break;
        case '1day':
        deadline = addDays(now, 1);
        break;
        case '3days':
        deadline = addDays(now, 3);
        break;
        case '1week':
        deadline = addWeeks(now, 1);
        break;
        case '2weeks':
        deadline = addWeeks(now, 2);
        break;
        case '1month':
        deadline = addMonths(now, 1);
        break;
        default:
        deadline = addHours(now, 1);
      }
    
    onChange(deadline);
    setIsOpen(false); // Close popup after selection
  };

  const handleCustomApply = () => {
    const now = new Date();
    
    // Use the selected date directly as the deadline
    if (!customDate) {
      // If no date selected, use now
      onChange(now);
      setIsOpen(false);
      return;
    }
    
    // Ensure selected date is not in the past and has proper time component
    const selectedDate = new Date(customDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    let deadline: Date;
      
    if (selectedDate.getTime() < today.getTime()) {
      // If selected date is in the past, use now
      deadline = now;
    } else if (selectedDate.getTime() === today.getTime()) {
      // If selected date is today, use current time
      deadline = now;
    } else {
      // If selected date is in the future, use end of that day (23:59:59)
      deadline = new Date(selectedDate);
      deadline.setHours(23, 59, 59, 999);
      }
    
    onChange(deadline);
    setIsOpen(false);
  };

  const getUrgencyLevel = (deadline: Date) => {
    const now = new Date();
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return { level: 'critical', color: 'bg-red-100 text-red-800', icon: '⚡' };
    if (diffHours < 6) return { level: 'urgent', color: 'bg-orange-100 text-orange-800', icon: '🔥' };
    if (diffHours < 24) return { level: 'high', color: 'bg-yellow-100 text-yellow-800', icon: '⏰' };
    if (diffHours < 72) return { level: 'medium', color: 'bg-blue-100 text-blue-800', icon: '📅' };
    return { level: 'low', color: 'bg-green-100 text-green-800', icon: '📆' };
  };

  const formatDeadline = (deadline: Date) => {
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    // Calculate remaining units
    const remainingMinutes = diffMinutes % 60;
    const remainingHours = diffHours % 24;
    const remainingDays = diffDays % 7;
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      // Show hours and remaining minutes
      if (remainingMinutes > 0) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
      } else {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      }
    } else if (diffDays < 7) {
      // Show days and remaining hours
      if (remainingHours > 0) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
      } else {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      }
    } else if (diffWeeks < 4) {
      // Show weeks and remaining days
      if (remainingDays > 0) {
        return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
      } else {
        return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}`;
      }
    } else if (diffMonths < 12) {
      // Show months and remaining days
      const remainingDaysAfterMonths = diffDays % 30;
      if (remainingDaysAfterMonths > 0) {
        return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ${remainingDaysAfterMonths} day${remainingDaysAfterMonths !== 1 ? 's' : ''}`;
      } else {
        return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
      }
    } else {
      return format(deadline, 'MMM dd, yyyy');
    }
  };

  // Use the actual value if provided, otherwise calculate from current selection
  const deadline = value ? new Date(value) : (() => {
    const now = new Date();
    if (timeType === 'quick') {
      switch (quickTime) {
        case '5min': return addMinutes(now, 5);
        case '15min': return addMinutes(now, 15);
        case '30min': return addMinutes(now, 30);
        case '1hour': return addHours(now, 1);
        case '2hours': return addHours(now, 2);
        case '6hours': return addHours(now, 6);
        case '12hours': return addHours(now, 12);
        case '1day': return addDays(now, 1);
        case '3days': return addDays(now, 3);
        case '1week': return addWeeks(now, 1);
        case '2weeks': return addWeeks(now, 2);
        case '1month': return addMonths(now, 1);
        default: return addHours(now, 1);
      }
    } else {
      const duration = parseInt(customDuration) || 1;
      const baseDate = customDate || now;
      switch (customDurationType) {
        case 'minutes': return addMinutes(baseDate, duration);
        case 'hours': return addHours(baseDate, duration);
        case 'days': return addDays(baseDate, duration);
        case 'weeks': return addWeeks(baseDate, duration);
        case 'months': return addMonths(baseDate, duration);
        default: return addHours(baseDate, duration);
      }
    }
  })();
  const urgency = getUrgencyLevel(deadline);

  // Content component to avoid duplication
  const DeadlineContent = () => {
    const isDesktop = !isMobile;

  return (
      <>
        <Card className="border-0 shadow-none">
          {isDesktop && (
            <CardHeader className={`pb-3 px-4 sm:px-6 pt-4 sm:pt-6 ${isDesktop && timeType === 'custom' ? 'px-4 pt-4 pb-3' : isDesktop ? 'px-8 pt-6 pb-4' : ''}`}>
              <CardTitle className={`font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black ${isDesktop && timeType === 'custom' ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-5xl sm:text-7xl lg:text-8xl xl:text-9xl'}`}>
                Deadline
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">There's no such thing as forever.</p>
            </CardHeader>
          )}
          <CardContent className={`space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6 ${isDesktop && timeType === 'custom' ? 'px-4 pb-4 space-y-4' : isDesktop ? 'px-8 pb-8 space-y-6' : 'px-2 py-2'}`}>
              {/* Time Type Toggle */}
            <div className={`flex space-x-2 sm:space-x-3 ${isDesktop ? 'space-x-4 mb-2' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeType('quick')}
                className={`flex-1 h-11 sm:h-9 text-sm sm:text-base font-bold ${isDesktop ? 'h-10 text-base' : ''} transition-all duration-200 relative overflow-hidden ${
                    timeType === 'quick' 
                      ? '!bg-red-600 !text-white !border-red-600 border-4 shadow-[0_6px_0_0_rgba(220,38,38,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:!bg-red-700 hover:shadow-[0_4px_0_0_rgba(220,38,38,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] active:shadow-[0_2px_0_0_rgba(220,38,38,0.4),inset_0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-[2px]' 
                      : 'bg-white text-black border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(0,0,0,0.05)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.1)] active:translate-y-[2px] hover:bg-red-50'
                  }`}
                >
                <Zap className={`mr-2 h-4 w-4 ${isDesktop ? 'h-4 w-4' : ''} relative z-10`} />
                  <span className="relative z-10">Quick Select</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeType('custom')}
                className={`flex-1 h-11 sm:h-9 text-sm sm:text-base font-bold ${isDesktop ? 'h-10 text-base' : ''} transition-all duration-200 relative overflow-hidden ${
                    timeType === 'custom' 
                      ? '!bg-red-600 !text-white !border-red-600 border-4 shadow-[0_6px_0_0_rgba(220,38,38,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:!bg-red-700 hover:shadow-[0_4px_0_0_rgba(220,38,38,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] active:shadow-[0_2px_0_0_rgba(220,38,38,0.4),inset_0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-[2px]' 
                      : 'bg-white text-black border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(0,0,0,0.05)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.1)] active:translate-y-[2px] hover:bg-red-50'
                  }`}
                >
                <CalendarIcon className={`mr-2 h-4 w-4 ${isDesktop ? 'h-4 w-4' : ''} relative z-10`} />
                  <span className="relative z-10">Custom</span>
                </Button>
              </div>

              {timeType === 'quick' ? (
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 ${isDesktop ? 'grid-cols-4 gap-3' : ''}`}>
                  {quickOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickSelect(option.value)}
                    className={`justify-start text-xs sm:text-sm h-12 sm:h-9 px-3 sm:px-4 font-medium transition-all ${
                      isDesktop 
                        ? 'h-14 px-4 text-sm hover:scale-105 hover:shadow-md flex-col items-center justify-center gap-1.5 py-3' 
                        : ''
                    } ${
                      quickTime === option.value && isDesktop
                        ? '!bg-black !text-white shadow-lg scale-105 border-black'
                        : ''
                    } ${
                      quickTime === option.value && !isDesktop
                        ? '!bg-black !text-white !border-black'
                        : ''
                    }`}
                    >
                    {option.icon && (
                      <span className={`${isDesktop ? 'text-2xl mb-0.5' : 'mr-1.5 sm:mr-1 text-base sm:text-sm'}`}>
                        {option.icon}
                      </span>
                    )}
                    <span className={`truncate ${isDesktop ? 'text-xs font-medium' : ''}`}>
                      {option.label}
                    </span>
                    </Button>
                  ))}
                </div>
              ) : (
              <div className={`space-y-4 sm:space-y-6 ${isDesktop && timeType === 'custom' ? 'space-y-4' : isDesktop ? 'space-y-6' : 'space-y-3'}`}>
                {/* Custom Date */}
                <div className="w-full">
                  <Label className={`text-sm sm:text-xs text-slate-600 mb-2 sm:mb-1 block ${isDesktop ? 'text-sm font-medium mb-2' : 'text-xs mb-1.5'}`}>
                    Select Deadline Date
                    </Label>
                  <div className={`flex justify-center w-full ${isDesktop ? '' : ''}`}>
                    <Calendar
                      mode="single"
                      selected={customDate}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      onSelect={(date) => {
                        if (date) {
                          // Simply set the selected date - no validation needed since disabled prop handles past dates
                          setCustomDate(date);
                          // Update calendar month to show the selected date's month
                          setCalendarMonth(date);
                        } else {
                          setCustomDate(undefined);
                        }
                      }}
                      showOutsideDays={false}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const checkDate = new Date(date);
                        checkDate.setHours(0, 0, 0, 0);
                        return checkDate < today;
                      }}
                      className={`rounded-md border w-full ${isDesktop ? 'mx-auto' : ''}`}
                      classNames={isDesktop ? {
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center",
                        month: "space-y-4 mx-auto",
                        table: "w-full border-collapse space-y-1 mx-auto",
                        head_row: "flex justify-center",
                        row: "flex w-full mt-2 justify-center",
                      } : undefined}
                    />
                    </div>
                  </div>

                <div className="relative">
                  <Button 
                    onClick={handleCustomApply} 
                    disabled={!customDate}
                    className={`w-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 font-black text-base py-3.5 rounded-xl border-[0.5px] border-blue-700 shadow-[0_6px_0_0_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.4)] active:translate-y-[4px] transition-all duration-200 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:via-blue-700 disabled:hover:to-blue-800 ${isDesktop ? 'h-11 text-base' : 'h-11 sm:h-9 text-base sm:text-sm'}`}
                  >
                    Apply
                  </Button>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none z-0" />
                </div>
                </div>
              )}

            {/* Preview - Enhanced for desktop */}
              {value && (
              <div className={`pt-3 sm:pt-4 border-t ${isDesktop ? 'pt-6 border-t-2' : 'pt-3 border-t'}`}>
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-sm ${isDesktop ? 'gap-3' : 'gap-2'}`}>
                  <span className={`text-slate-600 font-medium ${isDesktop ? 'text-base' : 'text-xs'}`}>Selected Deadline:</span>
                  <div className={`flex flex-row items-center gap-2 ${isDesktop ? 'gap-3' : 'gap-2 flex-wrap'}`}>
                    <Badge className={`${urgency.color} text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-0.5 w-fit ${isDesktop ? 'text-sm px-4 py-1.5' : ''}`}>
                        <span className="mr-1">{urgency.icon}</span>
                        {urgency.level.toUpperCase()}
                      </Badge>
                    <span className={`font-medium text-sm sm:text-base ${isDesktop ? 'text-base font-semibold text-slate-900' : ''}`}>
                        {format(deadline, 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                {isDesktop && (
                  <p className="text-xs text-slate-500 mt-2">
                    {formatDeadline(deadline)} from now
                  </p>
                )}
                </div>
              )}
            </CardContent>
          </Card>
      </>
    );
  };

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
        <Clock className="h-5 w-5 sm:h-5 sm:w-5 text-slate-600 flex-shrink-0" />
        <Label className="text-[10px] sm:text-xs font-medium">Response Deadline</Label>
        {value && (
          <Badge className={`${urgency.color} text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-0.5`}>
            <span className="mr-1">{urgency.icon}</span>
            {formatDeadline(deadline)}
          </Badge>
        )}
      </div>

      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal h-11 sm:h-9 text-[10px] sm:text-xs border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] relative overflow-hidden">
              {/* Physical button depth effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none z-0" />
              <CalendarIcon className="mr-2 h-4 w-4 sm:h-4 sm:w-4 relative z-10" />
              <span className="relative z-10">{value ? formatDeadline(deadline) : 'Set deadline'}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto border-2 border-black p-0 flex flex-col">
            <SheetHeader className="px-4 pt-4 pb-3 flex-shrink-0">
              <SheetTitle className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none font-heading drop-shadow-2xl text-black text-left w-full">Deadline</SheetTitle>
              <p className="text-xs text-slate-500 text-left mt-1">There's no such thing as forever.</p>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <DeadlineContent />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal h-11 sm:h-9 text-[10px] sm:text-xs border border-black focus:border-black focus:ring-4 focus:ring-black/20 rounded-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50 hover:from-white hover:to-slate-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] relative overflow-hidden">
              {/* Physical button depth effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none z-0" />
              <CalendarIcon className="mr-2 h-4 w-4 sm:h-4 sm:w-4 relative z-10" />
              <span className="relative z-10">{value ? formatDeadline(deadline) : 'Set deadline'}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className={`p-0 max-h-[85vh] overflow-y-auto border-2 lg:border border-black ${timeType === 'custom' ? 'w-[420px]' : 'w-[700px]'} data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 transition-all duration-300 ease-smooth will-change-[transform,opacity]`} 
            align="start"
            sideOffset={8}
          >
            <DeadlineContent />
        </PopoverContent>
      </Popover>
      )}

    </div>
  );
};

export default TimeLimitSelector;

