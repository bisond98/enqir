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
    { value: '5min', label: '5 minutes', icon: '⚡', color: 'text-red-600' },
    { value: '15min', label: '15 minutes', icon: '🔥', color: 'text-orange-600' },
    { value: '30min', label: '30 minutes', icon: '⏰', color: 'text-yellow-600' },
    { value: '1hour', label: '1 hour', icon: '⏱️', color: 'text-blue-600' },
    { value: '2hours', label: '2 hours', icon: '🕐', color: 'text-indigo-600' },
    { value: '6hours', label: '6 hours', icon: '🕕', color: 'text-purple-600' },
    { value: '12hours', label: '12 hours', icon: '🕛', color: 'text-pink-600' },
    { value: '1day', label: '1 day', icon: '📅', color: 'text-green-600' },
    { value: '3days', label: '3 days', icon: '📆', color: 'text-emerald-600' },
    { value: '1week', label: '1 week', icon: '🗓️', color: 'text-teal-600' },
    { value: '2weeks', label: '2 weeks', icon: '📊', color: 'text-cyan-600' },
    { value: '1month', label: '1 month', icon: '🗓️', color: 'text-sky-600' },
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
      const duration = parseInt(customDuration) || 1;
      const baseDate = customDate || now;
    let deadline: Date;
      
      switch (customDurationType) {
        case 'minutes':
        deadline = addMinutes(baseDate, duration);
        break;
        case 'hours':
        deadline = addHours(baseDate, duration);
        break;
        case 'days':
        deadline = addDays(baseDate, duration);
        break;
        case 'weeks':
        deadline = addWeeks(baseDate, duration);
        break;
        case 'months':
        deadline = addMonths(baseDate, duration);
        break;
        default:
        deadline = addHours(baseDate, duration);
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
          <CardHeader className={`pb-3 px-4 sm:px-6 pt-4 sm:pt-6 ${isDesktop ? 'px-8 pt-6 pb-4' : ''}`}>
            <CardTitle className={`text-base sm:text-lg font-medium ${isDesktop ? 'text-xl font-semibold' : ''}`}>
              Set Response Deadline
            </CardTitle>
            {isDesktop && (
              <p className="text-sm text-slate-500 mt-1">Choose when you need responses by</p>
            )}
            </CardHeader>
          <CardContent className={`space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6 ${isDesktop ? 'px-8 pb-8 space-y-6' : ''}`}>
              {/* Time Type Toggle */}
            <div className={`flex space-x-2 sm:space-x-3 ${isDesktop ? 'space-x-4 mb-2' : ''}`}>
                <Button
                  variant={timeType === 'quick' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeType('quick')}
                className={`flex-1 h-11 sm:h-9 text-sm sm:text-base font-medium ${isDesktop ? 'h-10 text-base hover:bg-blue-50 transition-colors' : ''}`}
                >
                <Zap className={`mr-2 h-4 w-4 ${isDesktop ? 'h-4 w-4' : ''}`} />
                  Quick Select
                </Button>
                <Button
                  variant={timeType === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeType('custom')}
                className={`flex-1 h-11 sm:h-9 text-sm sm:text-base font-medium ${isDesktop ? 'h-10 text-base hover:bg-blue-50 transition-colors' : ''}`}
                >
                <CalendarIcon className={`mr-2 h-4 w-4 ${isDesktop ? 'h-4 w-4' : ''}`} />
                  Custom
                </Button>
              </div>

              {timeType === 'quick' ? (
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 ${isDesktop ? 'grid-cols-4 gap-3' : ''}`}>
                  {quickOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={quickTime === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleQuickSelect(option.value)}
                    className={`justify-start text-xs sm:text-sm h-12 sm:h-9 px-3 sm:px-4 font-medium transition-all ${
                      isDesktop 
                        ? 'h-14 px-4 text-sm hover:scale-105 hover:shadow-md flex-col items-center justify-center gap-1.5 py-3' 
                        : ''
                    } ${
                      quickTime === option.value && isDesktop
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : ''
                    }`}
                    >
                    <span className={`${isDesktop ? 'text-2xl mb-0.5' : 'mr-1.5 sm:mr-1 text-base sm:text-sm'}`}>
                      {option.icon}
                    </span>
                    <span className={`truncate ${isDesktop ? 'text-xs font-medium' : ''}`}>
                      {option.label}
                    </span>
                    </Button>
                  ))}
                </div>
              ) : (
              <div className={`space-y-4 sm:space-y-6 ${isDesktop ? 'space-y-6' : ''}`}>
                {/* Custom Date - Desktop: Side by side layout */}
                <div className={isDesktop ? 'grid grid-cols-2 gap-6 items-start' : ''}>
                  <div className={isDesktop ? '' : ''}>
                    <Label className={`text-sm sm:text-xs text-slate-600 mb-2 sm:mb-1 block ${isDesktop ? 'text-sm font-medium mb-3' : ''}`}>
                      Start Date & Time
                    </Label>
                    <div className={isDesktop ? 'flex justify-start' : 'flex justify-center sm:block'}>
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={setCustomDate}
                        className={`rounded-md border w-full ${isDesktop ? 'w-auto' : ''}`}
                    />
                    </div>
                  </div>

                  {/* Custom Duration - Desktop: Show next to calendar */}
                  <div className={isDesktop ? 'space-y-4' : ''}>
                    <div>
                      <Label className={`text-sm sm:text-xs text-slate-600 mb-2 block ${isDesktop ? 'text-sm font-medium mb-3' : ''}`}>
                        Add Duration
                      </Label>
                      <div className={`grid grid-cols-2 gap-3 sm:gap-2 ${isDesktop ? 'gap-4' : ''}`}>
                        <div>
                      <Input
                        type="number"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        min="1"
                        max={durationTypes.find(d => d.value === customDurationType)?.max || 12}
                            className={`text-base sm:text-sm h-11 sm:h-9 ${isDesktop ? 'h-10 text-base' : ''}`}
                            placeholder="1"
                      />
                    </div>
                    <div>
                      <Select value={customDurationType} onValueChange={setCustomDurationType}>
                            <SelectTrigger className={`text-base sm:text-sm h-11 sm:h-9 ${isDesktop ? 'h-10 text-base' : ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {durationTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value} className={`text-base sm:text-sm ${isDesktop ? 'text-base' : ''}`}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                        </div>
                    </div>
                  </div>

                    {isDesktop && (
                      <Button 
                        onClick={handleCustomApply} 
                        className={`w-full h-11 sm:h-9 text-base sm:text-sm font-medium ${isDesktop ? 'h-11 text-base bg-blue-600 hover:bg-blue-700' : ''}`}
                      >
                        Apply Custom Time
                      </Button>
                    )}
                  </div>
                </div>

                {!isDesktop && (
                  <Button 
                    onClick={handleCustomApply} 
                    className="w-full h-11 sm:h-9 text-base sm:text-sm font-medium"
                  >
                    Apply Custom Time
                  </Button>
                )}
                </div>
              )}

            {/* Preview - Enhanced for desktop */}
              {value && (
              <div className={`pt-3 sm:pt-4 border-t ${isDesktop ? 'pt-6 border-t-2' : ''}`}>
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-sm ${isDesktop ? 'gap-3' : ''}`}>
                  <span className={`text-slate-600 font-medium ${isDesktop ? 'text-base' : ''}`}>Selected Deadline:</span>
                  <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${isDesktop ? 'gap-3 items-center' : ''}`}>
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
        <Label className="text-sm sm:text-base font-medium">Response Deadline</Label>
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
            <Button variant="outline" className="w-full justify-start text-left font-normal h-11 sm:h-9 text-base sm:text-sm">
              <CalendarIcon className="mr-2 h-4 w-4 sm:h-4 sm:w-4" />
              {value ? formatDeadline(deadline) : 'Set deadline'}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left text-lg sm:text-xl">Set Response Deadline</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <DeadlineContent />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal h-11 sm:h-9 text-base sm:text-sm hover:bg-slate-50 transition-colors">
              <CalendarIcon className="mr-2 h-4 w-4 sm:h-4 sm:w-4" />
              {value ? formatDeadline(deadline) : 'Set deadline'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-0 max-h-[85vh] overflow-y-auto" align="start">
            <DeadlineContent />
        </PopoverContent>
      </Popover>
      )}

    </div>
  );
};

export default TimeLimitSelector;

