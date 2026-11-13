import { useState, useEffect, useCallback } from 'react';
import {
  socialMarketingService,
  SocialPost,
  WeeklyCalendarResponse,
  SocialMarketingAiConfig,
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
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  Upload,
  AlertCircle,
  Share2,
  X,
  Plus,
  Image as ImageIcon,
  CalendarDays,
  Check,
  Copy,
  Eye,
  Star,
  ArrowLeft,
  ArrowRight,
  Globe,
  LayoutGrid,
  ThumbsUp,
  MessageCircle,
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

const cleanBurmeseText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\uD83C[\uDDE6-\uDDFF]/g, '') // strip regional indicator flag emojis
    .replace(/\bMM\b\s*✨?/gi, '')
    .replace(/MM\s*✨/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

const AI_PRESETS = [
  {
    id: 'gen-z',
    name: '🔥 Gen-Z Viral & Slang',
    tone: 'BEST FRIEND TEXTING',
    prompt:
      'လူငယ်ဆန်ဆန်၊ ရင်းရင်းနှီးနှီး WhatsApp မှာ စာပို့သလို ရေးပါ။ ရန်ကုန် slang တွေ (ရှယ်ပဲ၊ အမိုက်စား၊ ကွက်တိ၊ chill၊ vibe၊ အသည်းခိုက်) ထည့်ပါ။ စာကြောင်းရှည်ကြီးတွေ မရေးဘဲ တိုတောင်းသွက်လက်စွာ ဆွဲဆောင်ပါ။ MyTogether ရဲ့ ပထမအော်ဒါ ပို့ခ အခမဲ့ ကို မီးမောင်းထိုးပေးပါ။',
    forbidden: 'ရွှေမြန်မာ, မင်္ဂလာပါ, ကောင်းမွန်သော, အထူးသဖြင့်',
  },
  {
    id: 'foodie',
    name: '🍜 Foodie & Sensory Reviewer',
    tone: 'FANCY LIFESTYLE FLEXER',
    prompt:
      'သွားရည်ယိုဖွယ် အစားအသောက် Reviewer စတိုင် ရေးပါ။ ဟင်းလျာတွေရဲ့ အမွှေးအကြိုင်၊ အစပ်အဆိမ့် အရသာ၊ ကြွပ်ဆတ်ဆတ် texture တွေကို စိတ်ထဲ ပုံပေါ်အောင် ဖွဲ့နွဲ့ပါ။ ဘန်ကောက်က နာမည်ကြီး မြန်မာဆိုင်တွေကို Lalamove Live GPS နဲ့ အိမ်အရောက် ပူပူနွေးနွေး မှာစားနိုင်ကြောင်း ဆွဲဆောင်ပါ။',
    forbidden: 'ရွှေမြန်မာ, မင်္ဂလာပါ, သာယာသောနေ့',
  },
  {
    id: 'expat-pro',
    name: '💼 Bangkok Expat Advisor',
    tone: 'MIND-BLOWING FACT DROPPER',
    prompt:
      'ထိုင်းရောက် မြန်မာများအတွက် အမှန်တကယ် အသုံးဝင်သော Insider ဗဟုသုတများ၊ ဒေတာ အချက်အလက်များ (၉၀ ရက် သတင်းပို့ ဒဏ်ငွေ ၂,၀၀၀ ဘတ်၊ TM30၊ လူမှုဖူလုံရေး Section 33 ဆေးကုသခွင့်၊ ထိုင်းဘဏ်အကောင့် ဖွင့်နည်း) ကို တိကျစွာ ရေးသားပါ။ MyTogether Visa & Community တွင် ဝင်ရောက်စစ်ဆေးရန် လမ်းညွှန်ပါ။',
    forbidden: 'ရွှေမြန်မာ, မင်္ဂလာပါ',
  },
  {
    id: 'nostalgia',
    name: '💛 Heartwarming Nostalgia',
    tone: 'NOSTALGIC HEART PULL',
    prompt:
      'မိသားစုလက်ရာ ထမင်းဝိုင်း၊ ရန်ကုန် မနက်ခင်း လက်ဖက်ရည်ဆိုင် အငွေ့အသက်နှင့် အိမ်ပြန်လွမ်းစိတ်ကို နွေးထွေးနူးညံ့စွာ ဖွဲ့နွဲ့ပါ။ တစ်ယောက်တည်း အထီးကျန်မနေဘဲ MyTogether ဖြင့် အိမ်အရောက် မှာစားနိုင်ကြောင်း စိတ်ခွန်အားပေးပါ။',
    forbidden: 'ရွှေမြန်မာ, မင်္ဂလာပါ',
  },
];

export default function SocialMarketingCalendar() {
  const [calendar, setCalendar] = useState<WeeklyCalendarResponse | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [selectedDayTab, setSelectedDayTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'feed'>('calendar');
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [autoGenerating, setAutoGenerating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

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
  const [activeModalTab, setActiveModalTab] = useState<'upload' | 'preview'>('upload');

  // AI Training Studio State
  const [isAiStudioOpen, setIsAiStudioOpen] = useState<boolean>(false);
  const [aiConfig, setAiConfig] = useState<SocialMarketingAiConfig>({
    customPrompt: '',
    samplePosts: '',
    preferredTone: 'MIXED',
    forbiddenWords: '',
  });
  const [savingAiConfig, setSavingAiConfig] = useState<boolean>(false);
  const [testingAi, setTestingAi] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ caption: string; hashtags: string } | null>(null);
  const [testCategory, setTestCategory] = useState<string>('FOOD_AND_DINING');

  const handleOpenAiStudio = async () => {
    setIsAiStudioOpen(true);
    setTestResult(null);
    try {
      const config = await socialMarketingService.getAiConfig();
      if (config) {
        setAiConfig({
          customPrompt: config.customPrompt || '',
          samplePosts: config.samplePosts || '',
          preferredTone: config.preferredTone || 'MIXED',
          forbiddenWords: config.forbiddenWords || '',
        });
      }
    } catch {
      // Keep existing local state
    }
  };

  const handleSaveAiConfig = async () => {
    try {
      setSavingAiConfig(true);
      await socialMarketingService.saveAiConfig(aiConfig);
      toast.success('AI Training Rules saved! New generations will follow this style.');
      setIsAiStudioOpen(false);
    } catch (err: any) {
      toast.error('Failed to save AI training rules: ' + (err?.message || 'Error'));
    } finally {
      setSavingAiConfig(false);
    }
  };

  const handleTestGenerateAi = async () => {
    try {
      setTestingAi(true);
      const res = await socialMarketingService.testGenerateAi({
        category: testCategory,
        customPrompt: aiConfig.customPrompt,
        samplePosts: aiConfig.samplePosts,
        preferredTone: aiConfig.preferredTone,
        forbiddenWords: aiConfig.forbiddenWords,
      });
      setTestResult(res);
      toast.success('Sample post generated successfully!');
    } catch (err: any) {
      toast.error('Test generation failed: ' + (err?.message || 'Error'));
    } finally {
      setTestingAi(false);
    }
  };

  const handleApplyPreset = (preset: (typeof AI_PRESETS)[0]) => {
    setAiConfig((prev) => ({
      ...prev,
      customPrompt: preset.prompt,
      preferredTone: preset.tone,
      forbiddenWords: preset.forbidden,
    }));
    toast.info(`Preset applied: ${preset.name}`);
  };

  // Fetch calendar — auto-trigger generation silently if empty
  const loadCalendar = useCallback(async (week?: string) => {
    try {
      setLoading(true);
      const data = await socialMarketingService.getCalendar(week);
      setCalendar(data);
      if (data?.weekLabel) {
        setSelectedWeek(data.weekLabel);
      }

      // Auto-generate if no posts exist for the current week (backend cron may not have run yet)
      if (!week && (!data || data.totalPosts === 0)) {
        setAutoGenerating(true);
        try {
          const res = await socialMarketingService.generateCalendar();
          const fresh = await socialMarketingService.getCalendar(res.weekLabel);
          setCalendar(fresh);
          setSelectedWeek(res.weekLabel);
          toast.success(`✨ ${res.created} posts auto-generated for this week!`);
        } catch {
          // Silently ignore if auto-generation fails; user can try manually
        } finally {
          setAutoGenerating(false);
        }
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

  // Generate 1-week calendar (now only used for Regenerate flow)
  // handleGenerateWeek removed — backend cron + auto-generate on load handles this

  // Regenerate whole week fresh
  const handleRecreateWeek = async () => {
    if (!selectedWeek) return;
    if (
      !window.confirm(
        `Are you sure you want to regenerate all posts for week ${selectedWeek}? This replaces them with fresh viral Burmese captions.`,
      )
    ) {
      return;
    }

    try {
      setGenerating(true);
      toast.info(`Regenerating week ${selectedWeek}...`);
      await socialMarketingService.deleteWeek(selectedWeek);
      const res = await socialMarketingService.generateCalendar();
      toast.success(`Success! Generated ${res.created} fresh posts.`);
      await loadCalendar(res.weekLabel);
      await loadWeeks();
    } catch (err: any) {
      toast.error('Failed to regenerate week: ' + (err?.message || err));
    } finally {
      setGenerating(false);
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
    setPubCaption(cleanBurmeseText(post.caption || ''));
    setPubHashtags(cleanBurmeseText(post.hashtags || ''));
    setPubFacebook(true);
    setPubMyTogether(true);
    setPubImageFiles([]);
    setPubImagePreviews([]);
    setActiveModalTab('upload');

    // Intelligent schedule date/time:
    // Anchor directly to the card's target scheduledDate (e.g. 2026-11-14) and scheduledTime (e.g. 13:00)
    try {
      const d = new Date(post.scheduledDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const datePart = `${year}-${month}-${day}`;
      const timePart = post.scheduledTime || '13:00';

      const targetDate = new Date(`${datePart}T${timePart}:00`);
      const diffMinutes = (targetDate.getTime() - Date.now()) / (60 * 1000);

      if (diffMinutes >= 10) {
        // Slot is in the future -> prefill with card's exact slot and auto-enable schedule mode!
        setScheduleDateTime(`${datePart}T${timePart}`);
        setIsScheduledMode(true);
      } else {
        // Slot has passed (e.g., today's morning slot when it's now evening)
        // Default to immediate publish mode, but prefill schedule input with now + 1 hour as fallback
        setIsScheduledMode(false);
        const fallback = new Date(Date.now() + 60 * 60 * 1000);
        const fbYear = fallback.getFullYear();
        const fbMonth = String(fallback.getMonth() + 1).padStart(2, '0');
        const fbDay = String(fallback.getDate()).padStart(2, '0');
        const fbHours = String(fallback.getHours()).padStart(2, '0');
        const fbMins = String(fallback.getMinutes()).padStart(2, '0');
        setScheduleDateTime(`${fbYear}-${fbMonth}-${fbDay}T${fbHours}:${fbMins}`);
      }
    } catch {
      setIsScheduledMode(false);
      const fallback = new Date(Date.now() + 60 * 60 * 1000);
      const isoLocal = new Date(fallback.getTime() - fallback.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduleDateTime(isoLocal);
    }
  };

  // Copy Caption to Clipboard
  const handleCopyCaption = (post: SocialPost) => {
    const cleanCap = cleanBurmeseText(post.caption || '');
    const cleanTags = cleanBurmeseText(post.hashtags || '');
    const text = cleanTags ? `${cleanCap}\n\n${cleanTags}` : cleanCap;
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

  // Reorder: Set as Cover (Main) Photo (#1 in Facebook Collage)
  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    const files = [...pubImageFiles];
    const previews = [...pubImagePreviews];
    const [f] = files.splice(index, 1);
    const [p] = previews.splice(index, 1);
    setPubImageFiles([f, ...files]);
    setPubImagePreviews([p, ...previews]);
    toast.success('Selected photo is now the Main Facebook Cover Photo!');
  };

  // Move Photo Left/Right
  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pubImageFiles.length) return;
    const files = [...pubImageFiles];
    const previews = [...pubImagePreviews];
    const [f] = files.splice(fromIndex, 1);
    const [p] = previews.splice(fromIndex, 1);
    files.splice(toIndex, 0, f);
    previews.splice(toIndex, 0, p);
    setPubImageFiles(files);
    setPubImagePreviews(previews);
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

    // Strict validation for Facebook scheduling
    if (isScheduledMode) {
      if (!scheduleDateTime) {
        toast.error('Please select a scheduled date and time!');
        return;
      }
      const chosenMs = new Date(scheduleDateTime).getTime();
      const diffMinutes = (chosenMs - Date.now()) / (60 * 1000);
      if (diffMinutes < 10) {
        toast.error(
          'Scheduled time must be at least 10 minutes in the future (Facebook requirement). Please pick a future date and time!',
        );
        return;
      }
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
          ? `Scheduling post on Facebook for ${new Date(scheduleDateTime).toLocaleString()}...`
          : `Publishing ${pubImageFiles.length} photo(s)...`,
      );

      const res = await socialMarketingService.publishPost(publishingPost.id, formData);

      let hadError = false;

      // Facebook Check
      if (pubFacebook) {
        if (res.facebook?.posted) {
          if (res.facebook.isScheduled) {
            toast.success('📅 Successfully scheduled on Facebook Page (Scheduled Posts)!');
          } else {
            toast.success('📘 Successfully posted to Facebook Page!');
          }
        } else {
          hadError = true;
          toast.error(`Facebook Failed: ${res.facebook?.error || 'Could not post to Facebook'}`);
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
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Auto AI Schedule
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            7-day rolling calendar — auto-generated every Monday. Posts are refreshed weekly automatically.
          </p>
        </div>

        {/* Action Controls — Regenerate only (no manual Generate button) */}
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

          {/* Regenerate button — only shown when posts exist */}
          {calendar && calendar.totalPosts > 0 && (
            <Button
              onClick={handleRecreateWeek}
              disabled={generating}
              variant="outline"
              className="gap-2 font-medium shadow-xs"
              title="Regenerate all posts with fresh viral Burmese AI captions"
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 text-amber-500" />
              )}
              {generating ? 'Regenerating...' : 'Refresh Week'}
            </Button>
          )}

          {/* AI Train / Persona Tuning Button */}
          <Button
            onClick={handleOpenAiStudio}
            variant="outline"
            className="gap-2 font-medium shadow-xs border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            title="Train AI content style, brand voice & golden reference posts"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            Train AI Style
          </Button>
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

      {/* DAY TABS & VIEW MODE SWITCHER */}
      {!autoGenerating && calendar && calendar.totalPosts > 0 && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-2 border-b border-border">
          {/* Day Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
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
              const dateObj = new Date(dayKey + 'T00:00:00'); // force local parse
              const today = new Date();
              const isToday =
                dateObj.getFullYear() === today.getFullYear() &&
                dateObj.getMonth() === today.getMonth() &&
                dateObj.getDate() === today.getDate();
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = dateObj.getDate();
              const monthAbbr = dateObj.toLocaleDateString('en-US', { month: 'short' });
              const isSelected = selectedDayTab === dayKey;

              return (
                <Button
                  key={dayKey}
                  size="sm"
                  variant={isSelected ? 'default' : isToday ? 'secondary' : 'outline'}
                  className={`rounded-full text-xs px-3 h-8 gap-1 transition-all ${
                    isSelected
                      ? 'shadow-xs font-semibold'
                      : isToday
                      ? 'border-primary/50 font-semibold text-primary'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setSelectedDayTab(dayKey)}
                >
                  <span>{dayName}</span>
                  <span className="opacity-80">{monthAbbr} {dayNum}</span>
                  {isToday && !isSelected && (
                    <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  )}
                </Button>
              );
            })}
          </div>

          {/* Real Calendar vs Feed View Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border shrink-0 self-end md:self-auto">
            <Button
              size="sm"
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              className="h-7 text-xs gap-1.5 px-3 rounded-md font-medium shadow-2xs"
              onClick={() => {
                setViewMode('calendar');
                setSelectedDayTab('all');
              }}
              title="7-Day Full Week Planner Grid"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Week Calendar (7 Days)
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'feed' ? 'default' : 'ghost'}
              className="h-7 text-xs gap-1.5 px-3 rounded-md font-medium"
              onClick={() => setViewMode('feed')}
              title="Detailed Expanded Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Detailed Feed
            </Button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {(loading || autoGenerating) && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground px-1">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            {autoGenerating ? 'Auto-generating this week\'s content calendar...' : 'Loading calendar...'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-[220px] animate-pulse bg-muted/30" />
            ))}
          </div>
        </div>
      )}

      {/* Empty State — only shown if auto-generate also yielded nothing */}
      {!loading && !autoGenerating && calendar && calendar.totalPosts === 0 && (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">No posts available</h3>
            <p className="text-sm text-muted-foreground">
              The weekly calendar auto-generates every Monday. Click <strong>Refresh Week</strong> to generate now.
            </p>
            <Button onClick={handleRecreateWeek} disabled={generating} className="gap-2">
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              {generating ? 'Generating...' : 'Generate Now'}
            </Button>
          </div>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. PROFESSIONAL 7-DAY WEEK CALENDAR GRID VIEW (DEFAULT)         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {!loading && !autoGenerating && calendar && calendar.totalPosts > 0 && viewMode === 'calendar' && selectedDayTab === 'all' && (
        <div className="space-y-3">
          {/* Sub-header info bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span>7-Day Marketing Calendar Planner — <strong>{calendar.totalPosts} slots across 7 days</strong></span>
            </span>
            <span className="hidden sm:inline-block text-[11px] text-muted-foreground/80">
              💡 Click any card to edit, add photos, or publish/schedule
            </span>
          </div>

          {/* 7-Column Calendar Grid (Smooth horizontal scroll on smaller screens, full-width on desktop) */}
          <div className="overflow-x-auto pb-4 pt-1">
            <div className="min-w-[1240px] grid grid-cols-7 gap-3">
              {Object.entries(calendar.days).map(([dayKey, posts]) => {
                const dateObj = new Date(dayKey + 'T00:00:00');
                const today = new Date();
                const isToday =
                  dateObj.getFullYear() === today.getFullYear() &&
                  dateObj.getMonth() === today.getMonth() &&
                  dateObj.getDate() === today.getDate();
                const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const dayNumber = dateObj.getDate();
                const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

                return (
                  <div
                    key={dayKey}
                    className={`flex flex-col rounded-xl border transition-all duration-200 bg-card/60 backdrop-blur-sm ${
                      isToday
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
                        : 'border-border/80 hover:border-border'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div
                      className={`p-3 pb-2 rounded-t-xl border-b flex items-center justify-between ${
                        isToday
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/40 border-border/70 text-foreground'
                      }`}
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold tracking-wider">{dayOfWeek}</span>
                        <span className="text-xs text-muted-foreground font-semibold">{monthName} {dayNumber}</span>
                      </div>
                      {isToday ? (
                        <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider">
                          Today
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {posts.length} slots
                        </span>
                      )}
                    </div>

                    {/* 3 Slots in Chronological Order (Morning, Noon, Evening) */}
                    <div className="p-2 space-y-2.5 flex-1 flex flex-col justify-start">
                      {posts.map((post) => {
                        const cat = CATEGORY_MAP[post.category] || {
                          label: post.category,
                          icon: '📌',
                          color: 'bg-muted text-foreground border-border',
                        };

                        const slotInfo =
                          post.scheduledSlot === 'morning'
                            ? { icon: '🌅', time: '08:30' }
                            : post.scheduledSlot === 'noon'
                            ? { icon: '☀️', time: '13:00' }
                            : { icon: '🌙', time: '18:30' };

                        const isPublished = post.status === 'published';
                        const isScheduled = post.status === 'scheduled';
                        const cleanCap = cleanBurmeseText(post.caption || '');
                        const cleanTags = cleanBurmeseText(post.hashtags || '');
                        const hookLine = cleanCap.split('\n')[0] || cleanCap;
                        const bodySnippet = cleanCap.split('\n').slice(1).join(' ').trim() || cleanCap;

                        return (
                          <div
                            key={post.id}
                            onClick={() => handleOpenPublish(post)}
                            className={`group relative rounded-lg p-2.5 border transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 shadow-2xs hover:shadow-md ${
                              isPublished
                                ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 hover:border-emerald-500'
                                : isScheduled
                                ? 'border-blue-500/50 bg-blue-500/5 dark:bg-blue-950/20 hover:border-blue-500'
                                : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
                            }`}
                          >
                            {/* Slot Header */}
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="font-semibold text-foreground font-mono flex items-center gap-1">
                                <span>{slotInfo.icon}</span>
                                <span>{post.scheduledTime || slotInfo.time}</span>
                              </span>
                              {isPublished ? (
                                <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Live
                                </Badge>
                              ) : isScheduled ? (
                                <Badge className="bg-blue-600 text-white text-[9px] px-1 py-0 gap-0.5">
                                  <Clock className="w-2.5 h-2.5" /> Sched
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
                                  Draft
                                </Badge>
                              )}
                            </div>

                            {/* Category Pill */}
                            <div>
                              <span
                                className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border leading-tight ${cat.color}`}
                              >
                                {cat.label}
                              </span>
                            </div>

                            {/* Hook Headline */}
                            <p className="text-xs font-bold text-foreground line-clamp-2 font-sans leading-snug">
                              {hookLine}
                            </p>

                            {/* Body Snippet */}
                            <p className="text-[11px] text-muted-foreground line-clamp-2 font-sans leading-relaxed">
                              {bodySnippet}
                            </p>

                            {/* Hashtags */}
                            {cleanTags && (
                              <p className="text-[10px] text-muted-foreground/75 line-clamp-1 italic font-mono">
                                {cleanTags}
                              </p>
                            )}

                            {/* Footer Quick Action Buttons */}
                            <div
                              className="pt-1.5 border-t border-border/50 flex items-center justify-between gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => handleRegenerate(post.id)}
                                title="AI Regenerate Caption"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>

                              <Button
                                size="sm"
                                className="h-7 text-[11px] px-2 flex-1 gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-2xs"
                                onClick={() => handleOpenPublish(post)}
                              >
                                <Upload className="w-2.5 h-2.5" />
                                <span>Publish</span>
                              </Button>

                              <button
                                type="button"
                                onClick={() => handleCopyCaption(post)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground"
                                title="Copy caption"
                              >
                                {copiedId === post.id ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. DETAILED FEED VIEW (EXPANDED CARDS OR SINGLE DAY FOCUS)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {!loading && !autoGenerating && calendar && calendar.totalPosts > 0 && (viewMode === 'feed' || selectedDayTab !== 'all') && (
        <div className="space-y-8">
          {activeDays.map(([dayKey, posts]) => {
            const dateObj = new Date(dayKey + 'T00:00:00');
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

                        <CardContent className="p-3.5 pt-1 space-y-2.5 flex-1 flex flex-col justify-between">
                          {/* Standard Calendar Summary Preview */}
                          {(() => {
                            const cleanCap = cleanBurmeseText(post.caption || '');
                            const cleanTags = cleanBurmeseText(post.hashtags || '');
                            const hookLine = cleanCap.split('\n')[0] || cleanCap;
                            const bodySnippet = cleanCap.split('\n').slice(1).join(' ').trim() || cleanCap;

                            return (
                              <div className="space-y-2">
                                <div className="relative group bg-muted/30 hover:bg-muted/50 p-3 rounded-lg border border-border/50 transition-colors">
                                  {/* Hook Line (Bold Headline) */}
                                  <p className="text-xs font-bold text-foreground line-clamp-1 mb-1 font-sans">
                                    {hookLine}
                                  </p>
                                  {/* Body Summary Preview (Tidy 3-line clamp) */}
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-sans select-text">
                                    {bodySnippet}
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyCaption(post)}
                                    className="absolute top-2 right-2 p-1 rounded-md bg-background/80 hover:bg-background border border-border/60 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Copy full caption"
                                  >
                                    {copiedId === post.id ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>

                                {/* Hashtags */}
                                {cleanTags && (
                                  <p className="text-[11px] text-muted-foreground/80 line-clamp-1 italic font-mono">
                                    {cleanTags}
                                  </p>
                                )}

                                {/* Live Facebook Post link if available */}
                                {post.facebookPostUrl && (
                                  <a
                                    href={post.facebookPostUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-500 hover:text-blue-400 hover:underline pt-0.5"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View on Facebook
                                  </a>
                                )}
                              </div>
                            );
                          })()}

                          {/* Action Buttons */}
                          <div className="pt-2 flex items-center gap-2 border-t border-border/50">
                            {/* 1. Regenerate AI */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => handleRegenerate(post.id)}
                              title="Regenerate with fresh AI caption"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>

                            {/* 2. Publish / Post (Edit, Photos & Schedule all in one) */}
                            <Button
                              size="sm"
                              className="h-8 text-xs flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors"
                              onClick={() => handleOpenPublish(post)}
                              title="Upload Photos, Edit & Publish / Schedule"
                            >
                              <Upload className="w-3 h-3 text-white" />
                              <span className="text-white font-medium">Publish / Schedule</span>
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
      {/* PUBLISH & SCHEDULE MODAL DIALOG (MULTI-IMAGE & FB GRID STYLE) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(publishingPost)} onOpenChange={(open) => !open && setPublishingPost(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Upload className="w-5 h-5 text-blue-500" />
                Publish or Schedule Social Post
              </DialogTitle>
              {pubImageFiles.length > 0 && (
                <div className="flex items-center rounded-lg border p-1 bg-muted/40">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('upload')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      activeModalTab === 'upload' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    Edit & Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('preview')}
                    className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${
                      activeModalTab === 'preview' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    <Eye className="w-3 h-3" /> Facebook Grid Preview
                  </button>
                </div>
              )}
            </div>
            <DialogDescription>
              Attach photos, rearrange Facebook grid style, choose platforms, and publish immediately or schedule for a future time.
            </DialogDescription>
          </DialogHeader>

          {/* TAB 1: EDIT & PHOTOS */}
          {activeModalTab === 'upload' && (
            <div className="space-y-5 py-2">
              {/* Multi-Image Upload Area with Facebook Grid Controls */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    Photos to Post (Facebook Collage Grid) *
                  </Label>
                  {pubImageFiles.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {pubImageFiles.length} photo{pubImageFiles.length > 1 ? 's' : ''} selected
                    </Badge>
                  )}
                </div>

                {pubImagePreviews.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                      {pubImagePreviews.map((url, idx) => {
                        const isMain = idx === 0;
                        return (
                          <div
                            key={idx}
                            className={`relative group rounded-lg overflow-hidden border bg-background aspect-square flex flex-col justify-between transition-all ${
                              isMain ? 'ring-2 ring-blue-500 shadow-sm' : 'border-border'
                            }`}
                          >
                            <img
                              src={url}
                              alt={`Upload preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Badge */}
                            <div className="absolute top-1 left-1 flex items-center gap-1">
                              {isMain ? (
                                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 shadow-xs">
                                  <Star className="w-2.5 h-2.5 fill-white" /> Main Cover
                                </span>
                              ) : (
                                <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                  #{idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Top-Right Remove Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full shadow-xs"
                              title="Remove photo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Bottom Controls Bar */}
                            <div className="absolute bottom-0 inset-x-0 bg-black/75 p-1 flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, idx - 1)}
                                    className="p-1 hover:bg-white/20 rounded"
                                    title="Move left"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                )}
                                {idx < pubImagePreviews.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, idx + 1)}
                                    className="p-1 hover:bg-white/20 rounded"
                                    title="Move right"
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {!isMain && (
                                <button
                                  type="button"
                                  onClick={() => handleSetAsCover(idx)}
                                  className="text-[10px] text-amber-300 hover:underline flex items-center gap-0.5 px-1 py-0.5 rounded font-medium"
                                  title="Make this the prominent cover photo on Facebook"
                                >
                                  <Star className="w-2.5 h-2.5" /> Make Main
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

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
                      <p className="text-sm font-semibold">Click to upload photos (Single or Multiple for Collage)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        JPEG, PNG or WebP up to 25MB each. First photo acts as the main hero photo on Facebook.
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
                    <Label className="text-xs font-medium">Select Future Date & Time (Must be at least 10 mins ahead)</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="w-full sm:w-[300px]"
                    />
                  </div>
                )}
              </div>

              {/* Caption Quick Edit (Taller Textarea with Paragraph Spacing) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Caption & Message (Paragraph formatting)</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {pubCaption.length} characters
                  </span>
                </div>
                <Textarea
                  rows={9}
                  value={pubCaption}
                  onChange={(e) => setPubCaption(e.target.value)}
                  placeholder="Post caption with hook and paragraphs..."
                  className="leading-relaxed font-sans text-sm min-h-[220px] max-h-[420px] resize-y p-3.5 bg-background border-border shadow-xs"
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
          )}

          {/* TAB 2: LIVE FACEBOOK POST PREVIEW */}
          {activeModalTab === 'preview' && (
            <div className="space-y-4 py-2">
              <div className="max-w-lg mx-auto bg-card border border-border rounded-xl shadow-md overflow-hidden">
                {/* Facebook Header */}
                <div className="p-3.5 flex items-center justify-between border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      MT
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">MyTogether</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        {isScheduledMode && scheduleDateTime
                          ? `Scheduled: ${new Date(scheduleDateTime).toLocaleString()}`
                          : 'Just now'}{' '}
                        · <Globe className="w-3 h-3" />
                      </p>
                    </div>
                  </div>
                </div>

                {/* Facebook Post Body Text */}
                <div className="p-3.5 text-sm leading-relaxed font-sans text-foreground select-text whitespace-pre-wrap">
                  {pubCaption || 'Your post caption will appear here...'}
                </div>

                {pubHashtags && (
                  <div className="px-3.5 pb-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {pubHashtags}
                  </div>
                )}

                {/* Facebook Image Collage Grid */}
                {pubImagePreviews.length > 0 && (
                  <div className="border-t border-border/40 bg-muted/20">
                    {pubImagePreviews.length === 1 && (
                      <img
                        src={pubImagePreviews[0]}
                        alt="FB Post 1"
                        className="w-full max-h-[380px] object-cover"
                      />
                    )}

                    {pubImagePreviews.length === 2 && (
                      <div className="grid grid-cols-2 gap-0.5 h-[280px]">
                        <img
                          src={pubImagePreviews[0]}
                          alt="FB Post 1"
                          className="w-full h-full object-cover"
                        />
                        <img
                          src={pubImagePreviews[1]}
                          alt="FB Post 2"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {pubImagePreviews.length === 3 && (
                      <div className="grid grid-cols-2 gap-0.5 h-[320px]">
                        <img
                          src={pubImagePreviews[0]}
                          alt="FB Post 1"
                          className="w-full h-full object-cover"
                        />
                        <div className="grid grid-rows-2 gap-0.5 h-full">
                          <img
                            src={pubImagePreviews[1]}
                            alt="FB Post 2"
                            className="w-full h-full object-cover"
                          />
                          <img
                            src={pubImagePreviews[2]}
                            alt="FB Post 3"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {pubImagePreviews.length >= 4 && (
                      <div className="grid grid-cols-2 gap-0.5 h-[320px]">
                        <img
                          src={pubImagePreviews[0]}
                          alt="FB Post 1"
                          className="w-full h-full object-cover"
                        />
                        <div className="grid grid-rows-2 gap-0.5 h-full">
                          <img
                            src={pubImagePreviews[1]}
                            alt="FB Post 2"
                            className="w-full h-full object-cover"
                          />
                          <div className="relative w-full h-full">
                            <img
                              src={pubImagePreviews[2]}
                              alt="FB Post 3"
                              className="w-full h-full object-cover"
                            />
                            {pubImagePreviews.length > 3 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold">
                                +{pubImagePreviews.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Facebook Action Bar */}
                <div className="p-2.5 px-4 flex items-center justify-between text-muted-foreground border-t border-border/40 text-xs">
                  <div className="flex items-center gap-1.5">
                    <ThumbsUp className="w-4 h-4 text-blue-500" /> Like
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" /> Comment
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Share2 className="w-4 h-4" /> Share
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* AI TRAINING & PERSONA STUDIO MODAL                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={isAiStudioOpen} onOpenChange={setIsAiStudioOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  AI Content Training & Persona Studio
                  <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
                    Live Tuning
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Train the AI with your preferred voice, paste your favorite sample posts for few-shot learning, and set negative rules.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-3">
            {/* Quick Presets Row */}
            <div className="bg-muted/40 p-3.5 rounded-xl border space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Style Presets (Click to Auto-fill)
              </Label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {AI_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-xs h-8 gap-1.5 hover:border-purple-500/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                  >
                    <span>{preset.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Brand Voice & Instructions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <span>1. Brand Voice & Custom Instructions</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">High Priority</Badge>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {(aiConfig.customPrompt || '').length} characters
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                AI ကို ဘယ်လို လေသံ၊ စကားအသုံးအနှုန်း (Slang) တွေ သုံးခိုင်းချင်လဲ၊ MyTogether ရဲ့ ဘယ် Feature တွေကို ဦးစားပေး ခိုင်းချင်လဲ လမ်းညွှန်ချက် ရေးထည့်ပါ။
              </p>
              <Textarea
                rows={4}
                value={aiConfig.customPrompt || ''}
                onChange={(e) => setAiConfig((prev) => ({ ...prev, customPrompt: e.target.value }))}
                placeholder="ဥပမာ: လူငယ်ဆန်ဆန်၊ ရင်းရင်းနှီးနှီး ရေးသားပါ။ ရန်ကုန် slang တွေ (ရှယ်ပဲ၊ အမိုက်စား၊ ကွက်တိ၊ chill) ထည့်ပါ။ MyTogether ရဲ့ စားမယ် ပထမအော်ဒါ ပို့ခ အခမဲ့ ကို အမြဲ မီးမောင်းထိုးပေးပါ။..."
                className="font-sans text-sm leading-relaxed"
              />
            </div>

            {/* Few-Shot Learning: Golden Reference Posts */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>2. Golden Reference Posts (Few-Shot Examples)</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Best for Accuracy</Badge>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {(aiConfig.samplePosts || '').length} characters
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                သင် အကြိုက်ဆုံးဖြစ်သော Facebook Post ၁ ပုဒ်မှ ၃ ပုဒ်ကို ဤနေရာတွင် Paste ချပေးပါ။ AI သည် ထို Post များ၏ စာသားဖွဲ့စည်းပုံ၊ အဖြတ်အတောက်နှင့် လေသံကို အတိအကျ အတုယူ ရေးသားပေးပါမည်။
              </p>
              <Textarea
                rows={5}
                value={aiConfig.samplePosts || ''}
                onChange={(e) => setAiConfig((prev) => ({ ...prev, samplePosts: e.target.value }))}
                placeholder="သင် အကြိုက်ဆုံး Facebook Post များကို ဤနေရာတွင် ကူးယူ ထည့်သွင်းပါ... (ဥပမာ: မုန့်ဟင်းခါး review post၊ ဗီဇာ အကြံပြု post)"
                className="font-sans text-sm leading-relaxed"
              />
            </div>

            {/* Tone Preference & Forbidden Words Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">3. Preferred Primary Tone</Label>
                <p className="text-xs text-muted-foreground">အဓိက ဦးစားပေး လေသံ</p>
                <Select
                  value={aiConfig.preferredTone || 'MIXED'}
                  onValueChange={(val) => setAiConfig((prev) => ({ ...prev, preferredTone: val }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MIXED">🔄 MIXED (Balanced 7-Tone Rotation)</SelectItem>
                    <SelectItem value="BEST FRIEND TEXTING">💬 Best Friend Texting (Casual & Informal)</SelectItem>
                    <SelectItem value="MIND-BLOWING FACT DROPPER">🤯 Mind-Blowing Fact Dropper (Shocking & Insightful)</SelectItem>
                    <SelectItem value="NOSTALGIC HEART PULL">🫶 Nostalgic Heart Pull (Warm & Emotional)</SelectItem>
                    <SelectItem value="HYPE PERSON / FOMO MACHINE">⚡ Hype Person / FOMO (Urgent & Exciting)</SelectItem>
                    <SelectItem value="RELATABLE STORY (VIRAL POST)">📖 Relatable Story (Viral Narrative)</SelectItem>
                    <SelectItem value="LIFE UPGRADE ADVISOR">💡 Life Upgrade Advisor (Actionable Hacks)</SelectItem>
                    <SelectItem value="FANCY LIFESTYLE FLEXER">✨ Fancy Lifestyle Flexer (Aesthetic & Luxury)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">4. Forbidden Words / Blacklist</Label>
                <p className="text-xs text-muted-foreground">လုံးဝ မသုံးစေချင်သော စကားလုံးများ (ကော်မာ ခံပါ)</p>
                <Input
                  value={aiConfig.forbiddenWords || ''}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, forbiddenWords: e.target.value }))}
                  placeholder="ရွှေမြန်မာ, မင်္ဂလာပါ, အထူးကောင်းမွန်သော"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Interactive Test Playground */}
            <div className="border border-purple-500/30 bg-purple-500/5 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Live Test Playground (Instant Preview)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Generate လုပ်မည့် Category ရွေးပြီး သင်ပြင်ဆင်ထားသော Style ကို ချက်ချင်း စမ်းသပ်ထုတ်ကြည့်ပါ။
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={testCategory} onValueChange={setTestCategory}>
                    <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOOD_AND_DINING">🍜 စားသောက်ဆိုင်</SelectItem>
                      <SelectItem value="VISA_IMMIGRATION">📋 ဗီဇာ / Immigration</SelectItem>
                      <SelectItem value="MONEY_EXCHANGE">💰 ငွေကြေး / လဲနှုန်း</SelectItem>
                      <SelectItem value="BANGKOK_LIFE_HACKS">🏙️ ဘန်ကောက် Tips</SelectItem>
                      <SelectItem value="APP_SERVICES">📱 MyTogether App</SelectItem>
                      <SelectItem value="COMMUNITY_TIPS">🤝 Community</SelectItem>
                      <SelectItem value="HOLIDAY_CELEBRATION">🎉 ရုံးပိတ်ရက်</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleTestGenerateAi}
                    disabled={testingAi}
                    className="h-8 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-xs"
                  >
                    {testingAi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span className="text-white">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span className="text-white">Test Generate</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {testResult && (
                <div className="bg-background border rounded-lg p-3.5 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      ✓ Generated Preview ({testResult.caption.length} chars)
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`${testResult.caption}\n\n${testResult.hashtags}`);
                        toast.success('Copied test caption to clipboard');
                      }}
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                  <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground/90 max-h-48 overflow-y-auto p-2 bg-muted/30 rounded border">
                    {testResult.caption}
                  </div>
                  <div className="text-[11px] text-primary/80 font-mono">
                    {testResult.hashtags}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsAiStudioOpen(false)} disabled={savingAiConfig}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAiConfig}
              disabled={savingAiConfig}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
            >
              {savingAiConfig ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white">Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span className="text-white">Save & Apply to Calendar</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
