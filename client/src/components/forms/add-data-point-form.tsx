import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useCreateDataPoint } from "@/hooks/use-kpis";
import type { Kpi } from "@shared/schema";

// Custom schema for the form to handle date string conversion to Date object
const formSchema = z.object({
  value: z.coerce.number({ invalid_type_error: "Must be a valid number" }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
});

interface AddDataPointFormProps {
  kpi: Kpi;
  onSuccess?: () => void;
}

export function AddDataPointForm({ kpi, onSuccess }: AddDataPointFormProps) {
  const addDataPoint = useCreateDataPoint();

  // Default to today
  const today = new Date().toISOString().split('T')[0];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: 0,
      date: today,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addDataPoint.mutate({
      kpiId: kpi.id,
      value: values.value.toString(), // DB expects string/numeric
      date: new Date(values.date),
    }, {
      onSuccess: () => {
        form.reset({ ...values, value: 0 }); // Keep date but clear value
        onSuccess?.();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value ({kpi.format})</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="any"
                  placeholder="Enter value" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Enter the raw number. Do not include currency symbols or percent signs.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={addDataPoint.isPending} className="hover-elevate">
            {addDataPoint.isPending ? "Saving..." : "Record Data"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
