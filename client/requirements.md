## Packages
recharts | Advanced charting library for time series forecasting visualization
date-fns | Date manipulation and formatting for chart axes
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility to merge tailwind classes without style conflicts
lucide-react | Iconography

## Notes
- Assuming standard shadcn/ui components are available in `@/components/ui/`.
- Dark mode is forced at the CSS root level to guarantee the "dark mode professional" aesthetic requested.
- `datasets.data` expects an array of JSON objects. For the demo creation form, we use a simple textarea to accept valid JSON.
- Recharts `AreaChart` is used to visualize the `lower_bound` and `upper_bound` as a shaded confidence interval.
