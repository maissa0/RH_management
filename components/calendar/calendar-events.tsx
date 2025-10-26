"use client";

import { useState, useEffect } from "react";
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay, endOfDay, isAfter, isBefore, differenceInMinutes } from "date-fns";
import { CalendarIcon, Loader2, RefreshCw, Clock, MapPin, Users, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  htmlLink: string;
  organizer?: {
    email: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  status: string;
}

interface CalendarEventsProps {
  userId: string;
  maxEvents?: number;
  className?: string;
}

export function CalendarEvents({ userId, maxEvents = 5, className }: CalendarEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [hasCalendarIntegration, setHasCalendarIntegration] = useState(false);

  useEffect(() => {
    fetchCalendarEvents();
  }, [userId, activeTab]);

  const fetchCalendarEvents = async () => {
    if (isRefreshing) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      // Determine date range based on active tab
      let timeMin, timeMax;
      const now = new Date();
      
      if (activeTab === "today") {
        timeMin = startOfDay(now).toISOString();
        timeMax = endOfDay(now).toISOString();
      } else if (activeTab === "tomorrow") {
        const tomorrow = addDays(now, 1);
        timeMin = startOfDay(tomorrow).toISOString();
        timeMax = endOfDay(tomorrow).toISOString();
      } else if (activeTab === "upcoming") {
        timeMin = now.toISOString();
        timeMax = addDays(now, 14).toISOString(); // Next 2 weeks
      }

      // Fetch events from API
      const response = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin!)}&timeMax=${encodeURIComponent(timeMax!)}&maxResults=${maxEvents}`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.events || []);
        setHasCalendarIntegration(true);
      } else {
        if (data.error === "No calendar integration found") {
          setHasCalendarIntegration(false);
          // Don't show error toast for missing integration
        } else {
          toast.error(data.error || "Failed to fetch calendar events");
        }
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      toast.error("Failed to fetch calendar events");
      setEvents([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCalendarEvents();
  };

  const formatEventTime = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    
    let dateStr = "";
    if (isToday(startDate)) {
      dateStr = "Today";
    } else if (isTomorrow(startDate)) {
      dateStr = "Tomorrow";
    } else {
      dateStr = format(startDate, "EEE, MMM d");
    }
    
    const timeStr = `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
    return `${dateStr}, ${timeStr}`;
  };

  const getEventStatusColor = (event: CalendarEvent) => {
    const now = new Date();
    const startDate = parseISO(event.start.dateTime);
    const endDate = parseISO(event.end.dateTime);
    
    if (isAfter(now, endDate)) {
      return "bg-gray-500"; // Past event
    } else if (isAfter(now, startDate) && isBefore(now, endDate)) {
      return "bg-green-500"; // In progress
    } else if (differenceInMinutes(startDate, now) <= 30) {
      return "bg-yellow-500"; // Starting soon (within 30 minutes)
    } else if (event.status === "confirmed") {
      return "bg-blue-500"; // Confirmed future event
    } else {
      return "bg-purple-500"; // Tentative
    }
  };

  const getEventStatusText = (event: CalendarEvent) => {
    const now = new Date();
    const startDate = parseISO(event.start.dateTime);
    const endDate = parseISO(event.end.dateTime);
    
    if (isAfter(now, endDate)) {
      return "Completed";
    } else if (isAfter(now, startDate) && isBefore(now, endDate)) {
      return "In Progress";
    } else if (differenceInMinutes(startDate, now) <= 30) {
      return "Starting Soon";
    } else if (event.status === "confirmed") {
      return "Confirmed";
    } else {
      return "Tentative";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  if (!hasCalendarIntegration && !isLoading) {
    return (
      <Card className={cn("col-span-3", className)}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 size-5" />
            Calendar Events
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to see your upcoming events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Calendar className="size-16 text-muted-foreground opacity-50" />
            <p className="text-center text-muted-foreground">No calendar integration found</p>
            <Button onClick={() => signIn('google', { 
              callbackUrl: '/dashboard',
              scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
            })}>
              Connect Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("col-span-3", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 size-5" />
            Calendar Events
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>
          Your scheduled interviews and appointments
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          </TabsList>
          
          {["upcoming", "today", "tomorrow"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-3/4" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                        <div className="flex space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Calendar className="size-12 text-muted-foreground opacity-50" />
                  <p className="text-center text-muted-foreground">
                    {tab === "upcoming" 
                      ? "No upcoming events scheduled" 
                      : tab === "today" 
                        ? "No events scheduled for today" 
                        : "No events scheduled for tomorrow"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                      <div className="flex-shrink-0">
                        <Avatar className="h-12 w-12 border">
                          {event.organizer?.displayName ? (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(event.organizer.displayName)}
                            </AvatarFallback>
                          ) : (
                            <AvatarFallback>
                              <CalendarIcon className="size-6 text-muted-foreground" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium line-clamp-1">{event.summary}</h4>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-1 size-3.5" />
                          <span>{formatEventTime(event.start.dateTime, event.end.dateTime)}</span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-1 size-3.5" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                        
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="mr-1 size-3.5" />
                            <span className="line-clamp-1">
                              {event.attendees
                                .slice(0, 2)
                                .map(a => a.displayName || a.email.split('@')[0])
                                .join(", ")}
                              {event.attendees.length > 2 && ` +${event.attendees.length - 2} more`}
                            </span>
                          </div>
                        )}
                        
                        <div className="pt-1">
                          <a 
                            href={event.htmlLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="mr-1 size-3" />
                            View details
                          </a>
                        </div>
                      </div>
                      
                      <Badge className={cn("text-white whitespace-nowrap", getEventStatusColor(event))}>
                        {getEventStatusText(event)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full">
          <Link href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center w-full justify-center">
            Open Google Calendar
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 