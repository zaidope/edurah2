import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { GradebookService } from '@/lib/gradebook';

const CategoryItemSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  name: z.string().min(1, 'Category name is required'),
  weightPercent: z.number().min(0).max(100),
});

const UpdateCategoriesSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  categories: z.array(CategoryItemSchema).min(1, 'At least one category is required'),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: 'UNAVAILABLE', message: 'Database service unavailable' } },
        { status: 503 }
      );
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } },
        { status: 401 }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Faculty privileges required' } },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parseResult = UpdateCategoriesSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid category schema',
          },
        },
        { status: 400 }
      );
    }

    const { courseId, categories } = parseResult.data;

    // Validate weights sum to 100%
    const validation = GradebookService.validateCategoryWeights(categories);
    if (!validation.valid) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'WEIGHT_SUM_MISMATCH',
            message: validation.error || 'Category weights must sum to exactly 100%',
          },
        },
        { status: 400 }
      );
    }

    GradebookService.saveGradeCategories(courseId, categories, user.id);

    return NextResponse.json({
      data: {
        success: true,
        categories,
        totalWeight: validation.totalWeight,
      },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to save categories' } },
      { status: 500 }
    );
  }
}
