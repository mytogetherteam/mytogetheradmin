import { useState, useEffect, useCallback } from 'react';
import {
  socialMarketingService,
  SocialPost,
  WeeklyCalendarResponse,
} from '@/services/socialMarketingService';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Send,
  Pencil,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  Upload,
  AlertCircle,
  Share2,
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  CalendarDays,
  Check,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string }> = {
  VISA_IMMIGRATION: {
    label: '📋 ဗီဇာ / Immigration',
    icon: '📋',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  FOOD_AND_DINING: {
    label: '🍜 စားသောက်ဆိုင်',
    icon: '🍜',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  MONEY_EXCHANGE: {
    label: '💰 ငွေကြေး / လဲနှုန်း',
    icon: '💰',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  BANGKOK_LIFE_HACKS: {
    label: '🏙️ ဘန်ကောက် Tips',
    icon: '🏙️',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  HOLIDAY_CELEBRATION: {
    label: '🎉 ရုံးပိတ်ရက်',
    icon: '🎉',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  },
  APP_SERVICES: {
    label: '📱 MyTogether App',
    icon: '📱',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  COMMUNITY_TIPS: {
    label: '🤝 Community',
    icon: '🤝',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
};

export default function SocialMarketingCalendar() {
  const [calendar, setCalendar] = useState<WeeklyCalendarResponse | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [selectedDayTab, setSelectedDayTab] = useState<string>('all'); // 'all' or 'yyyy-MM-dd'
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [deletingWeek, setDeletingWeek] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Edit Modal State
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [editCaption, setEditCaption] = useState<string>('');
  const [editHashtags, setEditHashtags] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Publish / Schedule Modal State
  const [publishingPost, setPublishingPost] = useState<SocialPost | null>(null);
  const [pubImageFiles, setPubImageFiles] = useState<File[]>([]);
  const [pubImagePreviews, setPubImagePreviews] = useState<string[]>([]);
  const [pubFacebook, setPubFacebook] = useState<boolean>(true);
  const [pubMyTogether, setPubMyTogether] = useState<boolean>(true);
  const [pubCaption, setPubCaption] = useState<string>('');
  const [pubHashtags, setPubHashtags] = useState<string>('');
  const [isScheduledMode, setIsScheduledMode] = useState<boolean>(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');
  const [publishing, setPublishing] = useState<boolean>(false);

  // Fetch calendar
  const loadCalendar = useCallback(async (week?: string) => {
    try {
      setLoading(true);
      const data = await socialMarketingService.getCalendar(week);
      setCalendar(data);
      if (data?.weekLabel) {
        setSelectedWeek(data.weekLabel);
      }
    } catch (err: any) {
      toast.error('Failed to load content calendar: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available weeks
  const loadWeeks = useCallback(async () => {
    try {
      const weeks = await socialMarketingService.getWeeks();
      setAvailableWeeks(weeks || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadCalendar();
    loadWeeks();
  }, [loadCalendar, loadWeeks]);

  // Generate 1-week calendar
  const handleGenerateWeek = async () => {
    try {
      setGenerating(true);
      toast.info('Generating 1-week Burmese content calendar...');
      const res = await socialMarketingService.generateCalendar();
      toast.success(`Created ${res.created} posts for week ${res.weekLabel}!`);
      await loadCalendar(res.weekLabel);
      await loadWeeks();
    } catch (err: any) {
      toast.error('Failed to generate calendar: ' + (err?.message || err));
    } finally {
      setGenerating(false);
    }
  };

  // Re-create / Regenerate whole week fresh
  const handleRecreateWeek = async () => {
    if (!selectedWeek) return;
    if (
      !window.confirm(
        `Are you sure you want to clear and regenerate all posts for week ${selectedWeek}? This replaces them with fresh complete Burmese captions.`,
      )
    ) {
      return;
    }

    try {
      setDeletingWeek(true);
      toast.info(`Resetting week ${selectedWeek}...`);
      await socialMarketingService.deleteWeek(selectedWeek);
      toast.info('Generating fresh complete captions...');
      const res = await socialMarketingService.generateCalendar();
      toast.success(`Success! Generated ${res.created} fresh posts.`);
      await loadCalendar(res.weekLabel);
      await loadWeeks();
    } catch (err: any) {
      toast.error('Failed to reset week: ' + (err?.message || err));
    } finally {
      setDeletingWeek(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (post: SocialPost) => {
    setEditingPost(post);
    setEditCaption(post.caption || '');
    setEditHashtags(post.hashtags || '');
    setEditTime(post.scheduledTime || '08:30');
    setEditCategory(post.category || 'BANGKOK_LIFE_HACKS');
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      setSavingEdit(true);
      await socialMarketingService.updatePost(editingPost.id, {
        caption: editCaption,
        hashtags: editHashtags,
        scheduledTime: editTime,
        category: editCategory,
      });
      toast.success('Post content updated!');
      setEditingPost(null);
      loadCalendar(selectedWeek);
    } catch (err: any) {
      toast.error('Failed to update post: ' + (err?.message || err));
    } finally {
      setSavingEdit(false);
    }
  };

  // AI Regenerate single caption
  const handleRegenerate = async (id: number) => {
    try {
      toast.info('Regenerating caption...');
      await socialMarketingService.regenerateCaption(id);
      toast.success('Caption updated!');
      loadCalendar(selectedWeek);
    } catch (err: any) {
      toast.error('Failed to regenerate: ' + (err?.message || err));
    }
  };

  // Open Publish / Schedule Modal
  const handleOpenPublish = (post: SocialPost) => {
    setPublishingPost(post);
    setPubCaption(post.caption || '');
    setPubHashtags(post.hashtags || '');
    setPubFacebook(true);
    setPubMyTogether(true);
    setPubImageFiles([]);
    setPubImagePreviews([]);
    setIsScheduledMode(false);

    // Default scheduled time based on post slot
    try {
      const d = new Date(post.scheduledDate);
      const [h, m] = (post.scheduledTime || '08:30').split(':');
      d.setHours(Number(h) || 8, Number(m) || 30, 0, 0);
      const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduleDateTime(isoLocal);
    } catch {
      setScheduleDateTime('');
    }
  };

  // Copy Caption to Clipboard
  const handleCopyCaption = (post: SocialPost) => {
    const text = post.hashtags ? `${post.caption}\n\n${post.hashtags}` : post.caption;
    navigator.clipboard.writeText(text);
    setCopiedId(post.id);
    toast.success('Caption copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Multi-Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        toast.error('Only image files (JPEG, PNG, WebP) are allowed');
        return;
      }
      if (f.size > 25 * 1024 * 1024) {
        toast.error('Each image must be less than 25MB');
        return;
      }
    }

    const updatedFiles = [...pubImageFiles, ...files];
    setPubImageFiles(updatedFiles);

    const updatedPreviews = files.map((f) => URL.createObjectURL(f));
    setPubImagePreviews((prev) => [...prev, ...updatedPreviews]);

    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setPubImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPubImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Publish or Schedule
  const handlePublishSubmit = async () => {
    if (!publishingPost) return;
    if (pubImageFiles.length === 0) {
      toast.error('Please select at least 1 image to post!');
      return;
    }
    if (!pubFacebook && !pubMyTogether) {
      toast.error('Please select at least one platform: Facebook or MyTogether!');
      return;
    }

    try {
      setPublishing(true);
      const formData = new FormData();
      pubImageFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('facebook', String(pubFacebook));
      formData.append('mytogether', String(pubMyTogether));
      formData.append('caption', pubCaption);
      formData.append('hashtags', pubHashtags);

      if (isScheduledMode && scheduleDateTime) {
        formData.append('scheduledTime', new Date(scheduleDateTime).toISOString());
      }

      toast.info(
        isScheduledMode
          ? 'Scheduling post...'
          : `Publishing ${pubImageFiles.length} photo(s)...`,
      );

      const res = await socialMarketingService.publishPost(publishingPost.id, formData);

      let hadError = false;

      // Facebook Check
      if (pubFacebook) {
        if (res.facebook?.posted) {
          if (res.facebook.isScheduled) {
            toast.success('📅 Successfully scheduled on Facebook Page!');
          } else {
            toast.success('📘 Successfully posted to Facebook Page!');
          }
        } else {
          hadError = true;
          toast.error(
            `Facebook Failed: ${res.facebook?.error || 'Token expired. Please update FACEBOOK_PAGE_ACCESS_TOKEN in server .env'}`,
          );
        }
      }

      // MyTogether App Check
      if (pubMyTogether) {
        if (res.mytogether?.posted) {
          toast.success('📱 Successfully published to MyTogether App Feed!');
        } else {
          hadError = true;
          toast.error(`MyTogether App Failed: ${res.mytogether?.error || 'Could not save post'}`);
        }
      }

      if (!hadError) {
        setPublishingPost(null);
      }
      loadCalendar(selectedWeek);
    } catch (err: any) {
      toast.error('Publish error: ' + (err?.message || err));
    } finally {
      setPublishing(false);
    }
  };

  // Filter days based on tab
  const activeDays = calendar?.days
    ? Object.entries(calendar.days).filter(([dayKey]) => {
        if (selectedDayTab === 'all') return true;
        return dayKey === selectedDayTab;
      })
    : [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Share2 className="w-7 h-7 text-primary" />
              Social Marketing Content Calendar
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 py-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI & Smart Schedule
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Weekly Myanmar content calendar: auto-generated Burmese posts, photo album streaming, and scheduled publishing to Facebook & MyTogether App.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {availableWeeks.length > 0 && (
            <Select
              value={selectedWeek}
              onValueChange={(val) => {
                setSelectedWeek(val);
                loadCalendar(val);
              }}
            >
              <SelectTrigger className="w-[145px]">
                <SelectValue placeholder="Select Week" />
              </SelectTrigger>
              <SelectContent>
                {availableWeeks.map((w) => (
                  <SelectItem key={w} value={w}>
                    Week {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleGenerateWeek}
            disabled={generating}
            className="gap-2 bg-primary text-primary-foreground font-medium shadow-xs"
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            {generating ? 'Generating...' : 'Generate Week'}
          </Button>

          {calendar && calendar.totalPosts > 0 && (
            <Button
              variant="outline"
              size="default"
              onClick={handleRecreateWeek}
              disabled={deletingWeek || generating}
              className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
              title="Delete all incomplete posts and regenerate fresh Burmese captions"
            >
              {deletingWeek ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-destructive" />
              )}
              Reset & Regenerate
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {calendar && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Active Week</p>
              <p className="text-xl font-bold mt-0.5">{calendar.weekLabel}</p>
            </div>
            <CalendarIcon className="w-7 h-7 text-muted-foreground/30" />
          </Card>
          <Card className="p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Posts</p>
              <p className="text-xl font-bold mt-0.5">{calendar.totalPosts}</p>
            </div>
            <Clock className="w-7 h-7 text-blue-500/30" />
          </Card>
          <Card className="p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Published / Scheduled</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {calendar.publishedPosts}
              </p>
            </div>
            <CheckCircle2 className="w-7 h-7 text-emerald-500/30" />
          </Card>
          <Card className="p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Drafts Ready</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {calendar.draftPosts}
              </p>
            </div>
            <AlertCircle className="w-7 h-7 text-amber-500/30" />
          </Card>
        </div>
      )}

      {/* DAY TABS SELECTOR (Fixes "Cards are complex" - allows clean single day focus) */}
      {calendar && calendar.totalPosts > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-b border-border">
          <Button
            size="sm"
            variant={selectedDayTab === 'all' ? 'default' : 'ghost'}
            className="rounded-full text-xs px-3.5 h-8 gap-1.5"
            onClick={() => setSelectedDayTab('all')}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            All 7 Days ({calendar.totalPosts})
          </Button>

          {Object.keys(calendar.days).map((dayKey) => {
            const dateObj = new Date(dayKey);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const isSelected = selectedDayTab === dayKey;

            return (
              <Button
                key={dayKey}
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                className={`rounded-full text-xs px-3.5 h-8 gap-1 transition-all ${
                  isSelected ? 'shadow-xs font-semibold' : 'text-muted-foreground'
                }`}
                onClick={() => setSelectedDayTab(dayKey)}
              >
                <span>{dayName}</span>
                <span className="opacity-70">{dayNum}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[400px] animate-pulse bg-muted/30" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && calendar && calendar.totalPosts === 0 && (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">No posts in this week</h3>
            <p className="text-sm text-muted-foreground">
              Click the button below to generate 21 complete, category-targeted Burmese captions for the entire week!
            </p>
            <Button onClick={handleGenerateWeek} disabled={generating} className="gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generate 1-Week Content Calendar
            </Button>
          </div>
        </Card>
      )}

      {/* CALENDAR CONTENT DISPLAY */}
      {!loading && calendar && calendar.totalPosts > 0 && (
        <div className="space-y-8">
          {activeDays.map(([dayKey, posts]) => {
            const dateObj = new Date(dayKey);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const dateFormatted = dateObj.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div key={dayKey} className="space-y-4 bg-muted/20 p-5 rounded-2xl border border-border/70">
                {/* Day Header Banner */}
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <h2 className="text-lg font-bold text-foreground">
                      {dayName} — <span className="text-muted-foreground font-normal text-base">{dateFormatted}</span>
                    </h2>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {posts.length} Time Slots
                  </Badge>
                </div>

                {/* 3 Spacious Cards (Morning, Noon, Evening) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {posts.map((post) => {
                    const cat = CATEGORY_MAP[post.category] || {
                      label: post.category,
                      icon: '📌',
                      color: 'bg-muted text-foreground border-border',
                    };

                    const slotLabel =
                      post.scheduledSlot === 'morning'
                        ? '🌅 Morning'
                        : post.scheduledSlot === 'noon'
                        ? '☀️ Noon'
                        : '🌙 Evening';

                    const isPublished = post.status === 'published';
                    const isScheduled = post.status === 'scheduled';

                    return (
                      <Card
                        key={post.id}
                        className={`transition-all duration-200 border flex flex-col justify-between shadow-xs hover:shadow-md ${
                          isPublished
                            ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20'
                            : isScheduled
                            ? 'border-blue-500/50 bg-blue-500/5 dark:bg-blue-950/20'
                            : 'border-border bg-card'
                        }`}
                      >
                        <CardHeader className="p-4 pb-2 space-y-2">
                          {/* Slot & Status Bar */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              {slotLabel} <span className="text-muted-foreground font-mono">({post.scheduledTime})</span>
                            </span>
                            {isPublished ? (
                              <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Live
                              </Badge>
                            ) : isScheduled ? (
                              <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5 gap-1">
                                <Clock className="w-3 h-3" /> Scheduled
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                Draft
                              </Badge>
                            )}
                          </div>

                          {/* Category Tag */}
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border ${cat.color}`}
                            >
                              {cat.label}
                            </span>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-1 space-y-3 flex-1 flex flex-col justify-between">
                          {/* Burmese Caption Text Area */}
                          <div className="space-y-2">
                            <div className="relative group bg-muted/40 hover:bg-muted/60 p-3 rounded-lg border border-border/60 transition-colors">
                              <p className="text-sm text-foreground leading-relaxed font-sans select-text whitespace-pre-wrap">
                                {post.caption}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleCopyCaption(post)}
                                className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-background border border-border/60 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy caption"
                              >
                                {copiedId === post.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Hashtags */}
                            {post.hashtags && (
                              <p className="text-xs text-muted-foreground line-clamp-1 italic font-mono">
                                {post.hashtags}
                              </p>
                            )}

                            {/* Live Facebook Post link if available */}
                            {post.facebookPostUrl && (
                              <a
                                href={post.facebookPostUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-400 hover:underline pt-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> View on Facebook
                              </a>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 flex items-center gap-2 border-t border-border/60">
                            {/* 1. Edit */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs flex-1 gap-1.5 font-medium"
                              onClick={() => handleOpenEdit(post)}
                              title="Edit Caption or Time"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </Button>

                            {/* 2. Regenerate AI */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => handleRegenerate(post.id)}
                              title="Regenerate with fresh AI caption"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>

                            {/* 3. Publish / Schedule */}
                            <Button
                              size="sm"
                              className="h-8 text-xs flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                              onClick={() => handleOpenPublish(post)}
                              title="Upload Photos & Publish to Facebook / MyTogether"
                            >
                              <Upload className="w-3.5 h-3.5 text-white" />
                              <span className="text-white">Publish / Post</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. EDIT MODAL DIALOG */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(editingPost)} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Social Post Content
            </DialogTitle>
            <DialogDescription>
              Edit the Burmese caption, hashtags, time or category. Click Save when ready.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Posting Time</Label>
                <Input
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  placeholder="08:30"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_MAP).map(([key, item]) => (
                      <SelectItem key={key} value={key}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Burmese Caption</Label>
              <Textarea
                rows={5}
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="မြန်မာဘာသာဖြင့် Caption ရေးသားပါ..."
                className="leading-relaxed font-sans text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Hashtags</Label>
              <Input
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="#MyTogether #Bangkok #မြန်မာ"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit} className="bg-primary text-primary-foreground">
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. PUBLISH & SCHEDULE MODAL DIALOG (MULTI-IMAGE & SCHEDULE) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(publishingPost)} onOpenChange={(open) => !open && setPublishingPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Publish or Schedule Social Post
            </DialogTitle>
            <DialogDescription>
              Attach photos, choose platforms (Facebook / MyTogether App), and publish immediately or schedule for a future time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Multi-Image Upload Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Select Photos to Post *
                </Label>
                {pubImageFiles.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {pubImageFiles.length} photo{pubImageFiles.length > 1 ? 's' : ''} (Facebook Album)
                  </Badge>
                )}
              </div>

              {/* Photos Grid or Upload Box */}
              {pubImagePreviews.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                    {pubImagePreviews.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border border-border bg-background aspect-square flex items-center justify-center"
                      >
                        <img
                          src={url}
                          alt={`Upload preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full opacity-90 transition-opacity shadow-xs"
                          title="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}

                    {/* Add More Photos Box */}
                    <label
                      htmlFor="pub-image-input"
                      className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-[11px] font-medium">+ Add Photo</span>
                    </label>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="pub-image-input"
                  className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Click to upload photos (Single or Multiple)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      JPEG, PNG or WebP up to 25MB each. Multiple photos will publish as an album on Facebook.
                    </p>
                  </div>
                </label>
              )}

              <input
                id="pub-image-input"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Target Options Checkboxes */}
            <div className="space-y-2">
              <Label className="font-semibold">Publish Targets</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium">
                  <Checkbox
                    checked={pubFacebook}
                    onCheckedChange={(checked) => setPubFacebook(Boolean(checked))}
                  />
                  <span>📘 Facebook Page (MyTogether)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium">
                  <Checkbox
                    checked={pubMyTogether}
                    onCheckedChange={(checked) => setPubMyTogether(Boolean(checked))}
                  />
                  <span>📱 MyTogether App Social Feed</span>
                </label>
              </div>
            </div>

            {/* Publishing Schedule Mode (Immediate vs Scheduled) */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    Schedule for Later?
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Facebook will automatically publish this post at the exact scheduled date and time.
                  </p>
                </div>
                <Checkbox
                  checked={isScheduledMode}
                  onCheckedChange={(checked) => setIsScheduledMode(Boolean(checked))}
                />
              </div>

              {isScheduledMode && (
                <div className="pt-2 space-y-1.5">
                  <Label className="text-xs">Select Schedule Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                    className="w-full sm:w-[280px]"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Must be at least 15 minutes in the future for Facebook scheduling.
                  </p>
                </div>
              )}
            </div>

            {/* Caption Quick Edit */}
            <div className="space-y-1.5">
              <Label className="font-semibold">Caption & Message</Label>
              <Textarea
                rows={4}
                value={pubCaption}
                onChange={(e) => setPubCaption(e.target.value)}
                placeholder="Post caption text..."
                className="leading-relaxed font-sans text-sm"
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-1.5">
              <Label>Hashtags</Label>
              <Input
                value={pubHashtags}
                onChange={(e) => setPubHashtags(e.target.value)}
                placeholder="#MyTogether #Bangkok #မြန်မာ"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPublishingPost(null)} disabled={publishing}>
              Cancel
            </Button>
            <Button
              onClick={handlePublishSubmit}
              disabled={publishing || pubImageFiles.length === 0 || (!pubFacebook && !pubMyTogether)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
            >
              {publishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white">Processing...</span>
                </>
              ) : isScheduledMode ? (
                <>
                  <Clock className="w-4 h-4 text-white" />
                  <span className="text-white">Schedule Post</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span className="text-white">
                    Publish {pubImageFiles.length > 1 ? `${pubImageFiles.length} Photos` : ''} Now
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
