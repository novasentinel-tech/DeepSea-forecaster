import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertKpiSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateKpi } from "@/hooks/use-kpis";

interface CreateKpiFormProps {
  onSuccess?: () => void;
}

export function CreateKpiForm({ onSuccess }: CreateKpiFormProps) {
  const createKpi = useCreateKpi();

  const form = useForm<z.infer<typeof insertKpiSchema>>({
    resolver: zodResolver(insertKpiSchema),
    defaultValues: {
      name: "",
      category: "",
      format: "number",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof insertKpiSchema>) {
    createKpi.mutate(values, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>KPI Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Monthly Recurring Revenue" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Financial">Financial</SelectItem>
                    <SelectItem value="Engagement">Engagement</SelectItem>
                    <SelectItem value="Operational">Operational</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Format</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="currency">Currency ($)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
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
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What does this KPI measure?" 
                  className="resize-none" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={createKpi.isPending} className="w-full sm:w-auto hover-elevate">
            {createKpi.isPending ? "Creating..." : "Create KPI"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
