import { useState, useEffect, useCallback } from 'react';
import {
  socialMarketingService,
  SocialPost,
  WeeklyCalendarResponse,
} from '@/services/socialMarketingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Trash2,
  Upload,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string }> = {
  VISA_IMMIGRATION: { label: '📋 ဗီဇာ / Immigration', icon: '📋', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  FOOD_AND_DINING: { label: '🍜 စားသောက်ဆိုင်', icon: '🍜', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  MONEY_EXCHANGE: { label: '💰 ငွေကြေး / လဲနှုန်း', icon: '💰', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  BANGKOK_LIFE_HACKS: { label: '🏙️ ဘန်ကောက် Tips', icon: '🏙️', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  HOLIDAY_CELEBRATION: { label: '🎉 ရုံးပိတ်ရက်', icon: '🎉', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  APP_SERVICES: { label: '📱 MyTogether App', icon: '📱', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  COMMUNITY_TIPS: { label: '🤝 Community', icon: '🤝', color: 'bg-teal-100 text-teal-800 border-teal-200' },
};

export default function SocialMarketingCalendar() {
  const [calendar, setCalendar] = useState<WeeklyCalendarResponse | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  // Edit Modal State
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [editCaption, setEditCaption] = useState<string>('');
  const [editHashtags, setEditHashtags] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Publish Modal State
  const [publishingPost, setPublishingPost] = useState<SocialPost | null>(null);
  const [pubImageFile, setPubImageFile] = useState<File | null>(null);
  const [pubImagePreview, setPubImagePreview] = useState<string | null>(null);
  const [pubFacebook, setPubFacebook] = useState<boolean>(true);
  const [pubMyTogether, setPubMyTogether] = useState<boolean>(true);
  const [pubCaption, setPubCaption] = useState<string>('');
  const [pubHashtags, setPubHashtags] = useState<string>('');
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
      toast.info('Generating 1-week AI captions with Gemini... Please wait a few seconds.');
      const res = await socialMarketingService.generateCalendar();
      toast.success(`Success! Created ${res.created} posts for week ${res.weekLabel}.`);
      await loadCalendar(res.weekLabel);
      await loadWeeks();
    } catch (err: any) {
      toast.error('Failed to generate calendar: ' + (err?.message || err));
    } finally {
      setGenerating(false);
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
      toast.success('Post content updated successfully!');
      setEditingPost(null);
      loadCalendar(selectedWeek);
    } catch (err: any) {
      toast.error('Failed to update post: ' + (err?.message || err));
    } finally {
      setSavingEdit(false);
    }
  };

  // AI Regenerate
  const handleRegenerate = async (id: number) => {
    try {
      toast.info('Regenerating caption with Gemini AI...');
      await socialMarketingService.regenerateCaption(id);
      toast.success('Caption regenerated!');
      loadCalendar(selectedWeek);
    } catch (err: any) {
      toast.error('Failed to regenerate: ' + (err?.message || err));
    }
  };

  // Open Publish Modal
  const handleOpenPublish = (post: SocialPost) => {
    setPublishingPost(post);
    setPubCaption(post.caption || '');
    setPubHashtags(post.hashtags || '');
    setPubFacebook(true);
    setPubMyTogether(true);
    setPubImageFile(null);
    setPubImagePreview(null);
  };

  // Handle Image File Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPubImageFile(file);
      const url = URL.createObjectURL(file);
      setPubImagePreview(url);
    }
  };

  // Submit Publish
  const handlePublishSubmit = async () => {
    if (!publishingPost) return;
    if (!pubImageFile) {
      toast.error('Please select an image file to publish!');
      return;
    }
    if (!pubFacebook && !pubMyTogether) {
      toast.error('Please select at least one platform: Facebook or MyTogether!');
      return;
    }

    try {
      setPublishing(true);
      const formData = new FormData();
      formData.append('file', pubImageFile);
      formData.append('facebook', String(pubFacebook));
      formData.append('mytogether', String(pubMyTogether));
      formData.append('caption', pubCaption);
      formData.append('hashtags', pubHashtags);

      toast.info('Streaming image directly to Facebook / MyTogether... (Zero Storage)');
      const res = await socialMarketingService.publishPost(publishingPost.id, formData);

      if (res.success) {
        toast.success('Post published successfully!');
        if (res.facebook?.postUrl) {
          toast.info(`Facebook Post live: ${res.facebook.postUrl}`);
        }
        setPublishingPost(null);
        loadCalendar(selectedWeek);
      } else {
        toast.error('Publish encountered errors: ' + JSON.stringify(res));
      }
    } catch (err: any) {
      toast.error('Failed to publish: ' + (err?.message || err));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Share2 className="w-7 h-7 text-primary" />
              Social Marketing & Content Calendar
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 py-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Powered
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-generate 1-week Burmese captions with Gemini AI, attach photos, and publish to Facebook & MyTogether.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-3">
          {availableWeeks.length > 0 && (
            <Select
              value={selectedWeek}
              onValueChange={(val) => {
                setSelectedWeek(val);
                loadCalendar(val);
              }}
            >
              <SelectTrigger className="w-[160px]">
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
            className="gap-2 shadow-sm"
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            {generating ? 'Generating 21 Posts...' : 'Generate 1-Week Calendar'}
          </Button>
        </div>
      </div>

      {/* Overview Stats Bar */}
      {calendar && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Active Week</p>
              <p className="text-xl font-bold mt-0.5">{calendar.weekLabel}</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-muted-foreground/40" />
          </Card>
          <Card className="p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Posts</p>
              <p className="text-xl font-bold mt-0.5">{calendar.totalPosts}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500/40" />
          </Card>
          <Card className="p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Published</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{calendar.publishedPosts}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
          </Card>
          <Card className="p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Drafts Pending</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{calendar.draftPosts}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-500/40" />
          </Card>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Card key={i} className="h-[500px] animate-pulse bg-muted/30" />
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
            <h3 className="text-lg font-bold">No Content Calendar for this week</h3>
            <p className="text-sm text-muted-foreground">
              Click the button below to have Gemini AI automatically plan and write 21 engaging Burmese social media captions for the week!
            </p>
            <Button onClick={handleGenerateWeek} disabled={generating} className="gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generate 1-Week Content Calendar
            </Button>
          </div>
        </Card>
      )}

      {/* 7-Day Calendar Grid */}
      {!loading && calendar && calendar.totalPosts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 items-start">
          {Object.entries(calendar.days).map(([dayKey, posts]) => {
            const dateObj = new Date(dayKey);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div key={dayKey} className="space-y-3">
                {/* Day Header Column */}
                <div className="bg-muted/60 border rounded-lg p-3 text-center shadow-xs">
                  <span className="block text-xs uppercase font-bold text-muted-foreground tracking-wider">
                    {dayName}
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {dateStr}
                  </span>
                </div>

                {/* 3 Slots Cards (Morning, Noon, Evening) */}
                <div className="space-y-3">
                  {posts.map((post) => {
                    const cat = CATEGORY_MAP[post.category] || {
                      label: post.category,
                      icon: '📌',
                      color: 'bg-muted text-foreground',
                    };

                    const slotLabel =
                      post.scheduledSlot === 'morning'
                        ? 'Morning'
                        : post.scheduledSlot === 'noon'
                        ? 'Noon'
                        : 'Evening';

                    const isPublished = post.status === 'published';

                    return (
                      <Card
                        key={post.id}
                        className={`transition-all duration-200 border shadow-xs hover:shadow-md ${
                          isPublished
                            ? 'border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10'
                            : 'border-border bg-card'
                        }`}
                      >
                        <CardHeader className="p-3 pb-2 space-y-1.5">
                          {/* Slot & Category Bar */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {slotLabel} ({post.scheduledTime})
                            </span>
                            {isPublished ? (
                              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-5 gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Live
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                Draft
                              </Badge>
                            )}
                          </div>

                          {/* Category Tag */}
                          <div className="pt-0.5">
                            <span
                              className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md border ${cat.color}`}
                            >
                              {cat.label}
                            </span>
                          </div>
                        </CardHeader>

                        <CardContent className="p-3 pt-1 space-y-2.5">
                          {/* Burmese Caption Text */}
                          <div className="text-xs text-foreground leading-relaxed line-clamp-4 bg-muted/30 p-2 rounded-md font-sans border border-border/40">
                            {post.caption}
                          </div>

                          {/* Hashtags */}
                          {post.hashtags && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
                              {post.hashtags}
                            </p>
                          )}

                          {/* Live Facebook Link if published */}
                          {post.facebookPostUrl && (
                            <a
                              href={post.facebookPostUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> View Facebook Post
                            </a>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-1 flex items-center gap-1.5 border-t border-border/60">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1 gap-1 px-2"
                              onClick={() => handleOpenEdit(post)}
                              title="Edit Caption or Time"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleRegenerate(post.id)}
                              title="Regenerate with AI"
                            >
                              <RefreshCw className="w-3 h-3 text-muted-foreground" />
                            </Button>

                            <Button
                              size="sm"
                              className="h-7 text-xs flex-1 gap-1 px-2 bg-primary hover:bg-primary/90 text-white"
                              onClick={() => handleOpenPublish(post)}
                              title="Publish with Image"
                            >
                              <Send className="w-3 h-3" /> Post
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
                className="leading-relaxed"
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
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. PUBLISH MODAL DIALOG (STREAMING - ZERO STORAGE) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(publishingPost)} onOpenChange={(open) => !open && setPublishingPost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Publish Social Media Post
            </DialogTitle>
            <DialogDescription>
              Select an image from your device and choose where to publish. Image is streamed directly from memory (Zero S3 / Server Storage).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <Label className="font-semibold">Select Photo / Graphic to Post *</Label>
              <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-muted/20 transition-colors">
                {pubImagePreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={pubImagePreview}
                      alt="Preview"
                      className="max-h-56 max-w-full rounded-lg object-contain shadow-sm border"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('pub-image-input')?.click()}
                      >
                        Change Image
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPubImageFile(null);
                          setPubImagePreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="pub-image-input"
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Click to select photo or drag & drop</p>
                      <p className="text-xs text-muted-foreground mt-0.5">JPEG, PNG or WebP up to 25MB</p>
                    </div>
                  </label>
                )}
                <input
                  id="pub-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* Target Options Checkboxes */}
            <div className="space-y-2">
              <Label className="font-semibold">Publish Targets</Label>
              <div className="flex items-center gap-6 p-3 bg-muted/40 rounded-lg border">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <Checkbox
                    checked={pubFacebook}
                    onCheckedChange={(checked) => setPubFacebook(Boolean(checked))}
                  />
                  📘 Facebook Page (MyTogether)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <Checkbox
                    checked={pubMyTogether}
                    onCheckedChange={(checked) => setPubMyTogether(Boolean(checked))}
                  />
                  📱 MyTogether App Feed
                </label>
              </div>
            </div>

            {/* Caption Preview / Quick Edit */}
            <div className="space-y-1.5">
              <Label className="font-semibold">Caption & Message</Label>
              <Textarea
                rows={4}
                value={pubCaption}
                onChange={(e) => setPubCaption(e.target.value)}
                className="leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Hashtags</Label>
              <Input
                value={pubHashtags}
                onChange={(e) => setPubHashtags(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishingPost(null)} disabled={publishing}>
              Cancel
            </Button>
            <Button
              onClick={handlePublishSubmit}
              disabled={publishing || !pubImageFile || (!pubFacebook && !pubMyTogether)}
              className="gap-2 bg-primary text-white"
            >
              {publishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Publishing Now...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publish Post Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

