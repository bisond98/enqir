import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [customTime, setCustomTime] = useState<string>('12:00');
  const [customDuration, setCustomDuration] = useState<string>('1');
  const [customDurationType, setCustomDurationType] = useState<string>('hours');

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

  // Calculate deadline based on current selection
  const calculateDeadline = () => {
    const now = new Date();
    
    if (timeType === 'quick') {
      switch (quickTime) {
        case '5min':
          return addMinutes(now, 5);
        case '15min':
          return addMinutes(now, 15);
        case '30min':
          return addMinutes(now, 30);
        case '1hour':
          return addHours(now, 1);
        case '2hours':
          return addHours(now, 2);
        case '6hours':
          return addHours(now, 6);
        case '12hours':
          return addHours(now, 12);
        case '1day':
          return addDays(now, 1);
        case '3days':
          return addDays(now, 3);
        case '1week':
          return addWeeks(now, 1);
        case '2weeks':
          return addWeeks(now, 2);
        case '1month':
          return addMonths(now, 1);
        default:
          return addHours(now, 1);
      }
    } else {
      // Custom time logic
      const duration = parseInt(customDuration) || 1;
      const baseDate = customDate || now;
      
      switch (customDurationType) {
        case 'minutes':
          return addMinutes(baseDate, duration);
        case 'hours':
          return addHours(baseDate, duration);
        case 'days':
          return addDays(baseDate, duration);
        case 'weeks':
          return addWeeks(baseDate, duration);
        case 'months':
          return addMonths(baseDate, duration);
        default:
          return addHours(baseDate, duration);
      }
    }
  };

  const handleQuickSelect = (option: string) => {
    setQuickTime(option);
    const deadline = calculateDeadline();
    onChange(deadline);
  };

  const handleCustomApply = () => {
    const deadline = calculateDeadline();
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
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes`;
    } else if (diffHours < 24) {
      return `${diffHours} hours`;
    } else if (diffDays < 7) {
      return `${diffDays} days`;
    } else {
      return format(deadline, 'MMM dd, yyyy');
    }
  };

  const deadline = value ? new Date(value) : calculateDeadline();
  const urgency = getUrgencyLevel(deadline);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-slate-600" />
        <Label className="text-sm font-medium">Response Deadline</Label>
        {value && (
          <Badge className={urgency.color}>
            <span className="mr-1">{urgency.icon}</span>
            {formatDeadline(deadline)}
          </Badge>
        )}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDeadline(deadline) : 'Set deadline'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Set Response Deadline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Type Toggle */}
              <div className="flex space-x-2">
                <Button
                  variant={timeType === 'quick' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeType('quick')}
                  className="flex-1"
                >
                  Quick Select
                </Button>
                <Button
                  variant={timeType === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeType('custom')}
                  className="flex-1"
                >
                  Custom
                </Button>
              </div>

              {timeType === 'quick' ? (
                <div className="grid grid-cols-2 gap-2">
                  {quickOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={quickTime === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleQuickSelect(option.value)}
                      className="justify-start text-xs"
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Custom Date */}
                  <div>
                    <Label className="text-xs text-slate-600">Start Date</Label>
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={setCustomDate}
                      className="rounded-md border"
                    />
                  </div>

                  {/* Custom Duration */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-slate-600">Duration</Label>
                      <Input
                        type="number"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        min="1"
                        max={durationTypes.find(d => d.value === customDurationType)?.max || 12}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Type</Label>
                      <Select value={customDurationType} onValueChange={setCustomDurationType}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {durationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleCustomApply} className="w-full">
                    Apply Custom Time
                  </Button>
                </div>
              )}

              {/* Preview */}
              {value && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Deadline:</span>
                    <div className="flex items-center gap-2">
                      <Badge className={urgency.color}>
                        <span className="mr-1">{urgency.icon}</span>
                        {urgency.level.toUpperCase()}
                      </Badge>
                      <span className="font-medium">
                        {format(deadline, 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

    </div>
  );
};

export default TimeLimitSelector;

