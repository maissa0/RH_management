"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addHours, addDays, parse } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  date: z.date({
    required_error: "Please select a date",
  }),
  startTime: z.string({
    required_error: "Please select a start time",
  }),
  duration: z.string({
    required_error: "Please select a duration",
  }),
  location: z.string().optional(),
  attendees: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Define types for time slots and duration options
interface TimeSlot {
  value: string;
  label: string;
}

interface DurationOption {
  value: string;
  label: string;
}

// Generate time slots for the select input
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourFormatted = hour.toString().padStart(2, "0");
      const minuteFormatted = minute.toString().padStart(2, "0");
      const time = `${hourFormatted}:${minuteFormatted}`;
      const label = format(
        parse(time, "HH:mm", new Date()),
        "h:mm a"
      );
      slots.push({ value: time, label });
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Duration options
const durationOptions: DurationOption[] = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

interface ScheduleInterviewProps {
  candidateEmail?: string;
  candidateName?: string;
  jobTitle?: string;
  onScheduled?: () => void;
}

export function ScheduleInterview({
  candidateEmail,
  candidateName,
  jobTitle,
  onScheduled,
}: ScheduleInterviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: jobTitle ? `Interview for ${jobTitle}` : "Interview",
      description: "",
      date: addDays(new Date(), 1),
      startTime: "10:00",
      duration: "60",
      location: "",
      attendees: candidateEmail || "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Parse the date and time
      const startDateTime = parse(
        `${format(values.date, "yyyy-MM-dd")} ${values.startTime}`,
        "yyyy-MM-dd HH:mm",
        new Date()
      );
      
      // Calculate end time based on duration
      const endDateTime = addHours(startDateTime, parseInt(values.duration) / 60);
      
      // Format attendees as an array
      const attendeesList = values.attendees
        ? values.attendees.split(",").map(email => email.trim())
        : [];
      
      // Prepare the event data
      const eventData = {
        summary: values.title,
        description: values.description,
        start: {
          dateTime: startDateTime.toISOString(),
        },
        end: {
          dateTime: endDateTime.toISOString(),
        },
        location: values.location,
        attendees: attendeesList.map(email => ({ email })),
      };
      
      // Send the request to create the event
      const response = await fetch("/api/calendar/create-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Interview scheduled successfully");
        setIsOpen(false);
        if (onScheduled) onScheduled();
      } else {
        toast.error(data.error || "Failed to schedule interview");
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
      toast.error("Failed to schedule interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarIcon className="mr-2 size-4" />
          Schedule Interview
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule an Interview</DialogTitle>
          <DialogDescription>
            Create a calendar event for an interview. The candidate will receive an invitation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Interview for [Position]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Interview details, preparation instructions, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto size-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {durationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Office address, Zoom link, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attendees</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email addresses (comma-separated)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter email addresses separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Schedule Interview
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 