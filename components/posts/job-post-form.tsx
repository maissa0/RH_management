"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createJobPost, updateJobPost } from "@/actions/create-job-post.server";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  jobPostSchema,
  type JobPostFormData,
} from "@/lib/validations/job-post";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getJobWebsiteIntegrations, postJobToWebsites } from "@/actions/job-website-integrations.server";

// Define the JobPostWithDetails type based on the Prisma schema
interface JobPostWithDetails {
  id: string;
  title: string;
  description: string;
  companyName: string;
  status: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY" | "INTERNSHIP" | "FREELANCE";
  workplaceType: "ON_SITE" | "HYBRID" | "REMOTE";
  location: string | null;
  salary: string | null;
  applicationUrl: string | null;
  applicationEmail: string | null;
  address: string | null;
  userId: string;
  organizationId: string;
  archivedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  weights: Array<{
    id: string;
    name: string;
    weight: number;
    type: string;
    postId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface JobPostFormProps {
  post?: JobPostWithDetails;
  onSuccess?: () => void;
}

export function JobPostForm({ post, onSuccess }: JobPostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [integrations, setIntegrations] = useState<Array<{ id: string; provider: string; name: string }>>([]);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);
  const router = useRouter();

  const form = useForm<JobPostFormData>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: {
      title: post?.title ?? "",
      description: post?.description ?? "",
      companyName: post?.companyName ?? "",
      employmentType: post?.employmentType ?? "FULL_TIME",
      workplaceType: post?.workplaceType ?? "ON_SITE",
      location: post?.location ?? "",
      salary: post?.salary ?? "",
      applicationUrl: post?.applicationUrl ?? "",
      applicationEmail: post?.applicationEmail ?? "",
      skills: post?.weights.map(weight => ({
        name: weight.name,
        weight: weight.weight,
        type: weight.type as "HARD" | "SOFT"
      })) ?? [{ name: "", weight: 5, type: "HARD" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "skills",
    control: form.control,
  });

  useEffect(() => {
    async function loadIntegrations() {
      try {
        const result = await getJobWebsiteIntegrations();
        if (result.success && result.data) {
          // Map provider enum values to display names
          const mappedIntegrations = result.data.map((integration: any) => ({
            id: integration.id,
            provider: integration.provider,
            name: integration.provider.charAt(0) + integration.provider.slice(1).toLowerCase(),
          }));
          setIntegrations(mappedIntegrations);
        }
      } catch (error) {
        console.error("Failed to load integrations:", error);
      } finally {
        setIsLoadingIntegrations(false);
      }
    }

    loadIntegrations();
  }, []);

  async function onSubmit(data: JobPostFormData) {
    try {
      setIsSubmitting(true);
      const response = post 
        ? await updateJobPost(post.id, data)
        : await createJobPost(data);

      if (response.success) {
        toast.success(response.message);
        
        // If there are selected integrations and we have a post ID, post to websites
        if (selectedIntegrations.length > 0 && response.data?.id) {
          const postId = post?.id || response.data.id;
          const postToWebsitesResponse = await postJobToWebsites(postId, selectedIntegrations);
          
          if (postToWebsitesResponse.success) {
            toast.success(postToWebsitesResponse.message);
          } else {
            toast.error(postToWebsitesResponse.message);
          }
        }
        
        form.reset();
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="Senior Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Tech Company Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full-time</SelectItem>
                      <SelectItem value="PART_TIME">Part-time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="TEMPORARY">Temporary</SelectItem>
                      <SelectItem value="INTERNSHIP">Internship</SelectItem>
                      <SelectItem value="FREELANCE">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workplaceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workplace Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workplace type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ON_SITE">On-site</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                      <SelectItem value="REMOTE">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="New York, NY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary Range</FormLabel>
                  <FormControl>
                    <Input placeholder="$80,000 - $120,000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="applicationUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/apply" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applicationEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Email</FormLabel>
                  <FormControl>
                    <Input placeholder="jobs@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the role and responsibilities..."
                    className="h-32 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Skills & Technologies</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "", weight: 5, type: "HARD" })}
              >
                <Plus className="mr-2 size-4" />
                Add Skill
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-4 rounded-lg border p-4">
                <div className="grid gap-4 md:grid-cols-[2fr,1fr,auto]">
                  <FormField
                    control={form.control}
                    name={`skills.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., React, TypeScript"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`skills.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HARD">Hard Skill</SelectItem>
                            <SelectItem value="SOFT">Soft Skill</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name={`skills.${index}.weight`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importance (1-10)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="flex-1"
                          />
                          <span className="w-12 text-center">
                            {field.value}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {integrations.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Post to Job Websites</h3>
              <p className="text-sm text-muted-foreground">
                Select the job websites where you want to post this job.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`integration-${integration.id}`}
                    checked={selectedIntegrations.includes(integration.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIntegrations([...selectedIntegrations, integration.id]);
                      } else {
                        setSelectedIntegrations(
                          selectedIntegrations.filter((id) => id !== integration.id)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`integration-${integration.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {integration.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoadingIntegrations && (
          <div className="flex items-center space-x-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading job website integrations...</span>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {post ? "Update Job Post" : "Create Job Post"}
        </Button>
      </form>
    </Form>
  );
}
