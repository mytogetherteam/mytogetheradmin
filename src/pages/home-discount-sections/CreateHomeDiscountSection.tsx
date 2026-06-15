import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-utils';
import { getScheduleOverlapMessage } from '@/lib/home-discount-section-errors';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { DateTimePickerField } from '@/components/common/DateTimePickerField';
import { HomeDiscountSectionService } from '@/services/homeDiscountSectionService';

export default function CreateHomeDiscountSection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [discountPercent, setDiscountPercent] = useState('30');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadSection = async (sectionId: number) => {
    setLoading(true);
    try {
      const section = await HomeDiscountSectionService.getSectionById(sectionId);
      setTitle(section.title || '');
      setDiscountPercent(String(section.discountPercent));
      setStartTime(section.startTime ? new Date(section.startTime) : null);
      setEndTime(section.endTime ? new Date(section.endTime) : null);
      setScheduleError(null);
    } catch (error) {
      handleApiError(error, 'Failed to load home discount section');
      navigate('/home-discount-sections/manage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode && id) {
      loadSection(parseInt(id, 10));
      return;
    }

    setTitle('');
    setDiscountPercent('30');
    setStartTime(null);
    setEndTime(null);
    setScheduleError(null);
  }, [id, isEditMode]);

  const handleStartTimeChange = (value: Date | null) => {
    setStartTime(value);
    setScheduleError(null);
  };

  const handleEndTimeChange = (value: Date | null) => {
    setEndTime(value);
    setScheduleError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);

    const parsedPercent = Number.parseInt(discountPercent, 10);
    if (Number.isNaN(parsedPercent) || parsedPercent < 1 || parsedPercent > 100) {
      toast.error('Discount percent must be between 1 and 100');
      return;
    }

    if (startTime && endTime && endTime < startTime) {
      setScheduleError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim() || null,
        discountPercent: parsedPercent,
        startTime: startTime ? startTime.toISOString() : null,
        endTime: endTime ? endTime.toISOString() : null,
      };

      if (isEditMode && id) {
        await HomeDiscountSectionService.updateSection(parseInt(id, 10), payload);
        toast.success('Home discount section updated');
      } else {
        await HomeDiscountSectionService.createSection(payload);
        toast.success('Home discount section created');
      }
      navigate('/home-discount-sections/manage');
    } catch (error) {
      const overlapMessage = getScheduleOverlapMessage(error);
      if (overlapMessage) {
        setScheduleError(overlapMessage);
        toast.error('Schedule overlap', {
          description: overlapMessage.split('\n')[0],
          duration: 10000,
        });
        return;
      }
      handleApiError(
        error,
        isEditMode
          ? 'Failed to update home discount section'
          : 'Failed to create home discount section',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await HomeDiscountSectionService.deleteSection(parseInt(id, 10));
      toast.success('Home discount section deleted');
      navigate('/home-discount-sections/manage');
    } catch (error) {
      handleApiError(error, 'Failed to delete home discount section');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? 'Edit Home Discount Section' : 'Create Home Discount Section'}
          </h1>
          <p className="text-muted-foreground">
            You can create multiple sections, but their schedules cannot overlap.
          </p>
        </div>
      </div>

      {scheduleError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Schedule overlap</AlertTitle>
          <AlertDescription className="whitespace-pre-line">
            {scheduleError}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Section details</CardTitle>
            <CardDescription>
              Use <code>{'{}'}</code> in the title as a placeholder for the discount percentage.
              Leave start/end empty for an always-on window. Only one section may be active at the
              same time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="Summer {} Off"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default title template in the user app.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPercent">Discount percent</Label>
              <Input
                id="discountPercent"
                type="number"
                min={1}
                max={100}
                required
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>

            <DateTimePickerField
              label="Start time (optional)"
              value={startTime}
              onChange={handleStartTimeChange}
              error={scheduleError ? 'Adjust schedule to avoid overlap' : undefined}
            />

            <DateTimePickerField
              label="End time (optional)"
              value={endTime}
              onChange={handleEndTimeChange}
              error={scheduleError ? 'Adjust schedule to avoid overlap' : undefined}
            />

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditMode ? 'Save changes' : 'Create section'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/home-discount-sections/manage')}
              >
                Cancel
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete home discount section?"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
