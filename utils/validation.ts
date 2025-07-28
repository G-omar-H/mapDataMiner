import { z } from 'zod';

export const searchParamsSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  categories: z.array(z.string()).default([]),
  radius: z.number().min(100, 'Radius must be at least 100 meters').max(50000, 'Radius cannot exceed 50,000 meters'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  maxResults: z.number().min(10, 'Minimum 10 results').max(500, 'Maximum 500 results'),
  searchMode: z.enum(['preview', 'full', 'unlimited'])
});

export const exportOptionsSchema = z.object({
  format: z.enum(['csv', 'xlsx']),
  includePhotos: z.boolean().default(false),
  selectedFields: z.array(z.string()).default([])
});

export const googleSheetsConfigSchema = z.object({
  spreadsheetId: z.string().optional(),
  sheetName: z.string().min(1, 'Sheet name is required'),
  credentials: z.any().optional()
});

export const filterOptionsSchema = z.object({
  category: z.string().optional(),
  minRating: z.number().min(1).max(5).optional(),
  hasWebsite: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  sortBy: z.enum(['name', 'rating', 'reviewCount', 'distance']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export type SearchParamsInput = z.infer<typeof searchParamsSchema>;
export type ExportOptionsInput = z.infer<typeof exportOptionsSchema>;
export type GoogleSheetsConfigInput = z.infer<typeof googleSheetsConfigSchema>;
export type FilterOptionsInput = z.infer<typeof filterOptionsSchema>;

export const validateSearchParams = (data: unknown) => {
  return searchParamsSchema.safeParse(data);
};

export const validateExportOptions = (data: unknown) => {
  return exportOptionsSchema.safeParse(data);
};

export const validateGoogleSheetsConfig = (data: unknown) => {
  return googleSheetsConfigSchema.safeParse(data);
};

export const validateFilterOptions = (data: unknown) => {
  return filterOptionsSchema.safeParse(data);
}; 