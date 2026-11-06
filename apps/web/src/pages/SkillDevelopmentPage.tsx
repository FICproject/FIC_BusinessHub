import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  getStoredUser,
  getPublicLearningVideos,
  getMentorsDirectory,
  incrementVideoViews,
  ILearningVideo,
  IMentorDirectoryItem
} from '../services/api';
import {
  WorkspaceShell,
  WorkspaceHero,
  WorkspaceCard,
  WorkspaceKpi,
  WorkspaceButton,
  WorkspaceBadge,
  WorkspaceEmptyState
} from '../components/workspace/WorkspaceComponents';
import { AnimatedModal, AnimatedCounter, StaggerContainer, StaggerItem } from '../motion';
import {
  RocketIcon,
  CalendarIcon,
  VideoIcon,
  SearchIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  BriefcaseIcon
} from '../components/Icons';

export const SkillDevelopmentPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [videos, setVideos] = useState<ILearningVideo[]>([]);
  const [mentors, setMentors] = useState<IMentorDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Video Modal
  const [activeVideo, setActiveVideo] = useState<ILearningVideo | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [videoList, mentorList] = await Promise.all([
        getPublicLearningVideos(),
        getMentorsDirectory()
      ]);
      setVideos(videoList);
      setMentors(mentorList);
    } catch (_e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered videos
  const filteredVideos = videos.filter((v) => {
    if (selectedSubject !== 'ALL' && v.subject !== selectedSubject) return false;
    if (selectedLevel !== 'ALL' && v.studentLevel !== selectedLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchDesc = v.description.toLowerCase().includes(q);
      const matchMentor = v.mentorName.toLowerCase().includes(q);
      const matchSub = v.subject.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchMentor && !matchSub) return false;
    }
    return true;
  });

  const uniqueSubjects = Array.from(new Set(videos.map((v) => v.subject).filter(Boolean)));

  const handleWatchVideo = (video: ILearningVideo) => {
    setActiveVideo(video);
    if (video.id || video._id) {
      incrementVideoViews(video.id || video._id || '');
    }
  };

  const handleBookMentor = (mentorId: string, mentorName: string) => {
    navigate(`/meetings?action=book&mentorId=${encodeURIComponent(mentorId)}&mentorName=${encodeURIComponent(mentorName)}`);
  };

  return (
    <WorkspaceShell>
      {/* 1. HERO BANNER */}
      <WorkspaceHero
        accent="violet"
        title="Skill Development & Video Masterclasses"
        subtitle="Watch practical engineering and career masterclasses recorded by accredited FIC mentors, master domain fundamentals, and schedule 1-on-1 advisory sessions."
        rightActions={
          <div className="flex flex-wrap items-center gap-2.5">
            <WorkspaceButton
              variant="primary"
              size="sm"
              icon={<CalendarIcon size={14} />}
              onClick={() => navigate('/meetings?action=book')}
            >
              Book a Mentor
            </WorkspaceButton>
            <WorkspaceButton
              variant="outline"
              size="sm"
              icon={<BriefcaseIcon size={14} />}
              onClick={() => navigate('/marketplace')}
            >
              Explore Internships
            </WorkspaceButton>
          </div>
        }
      />

      {/* 2. KPI TELEMETRY */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5 lg:gap-4">
        <StaggerItem>
          <WorkspaceKpi
            title="Available Masterclasses"
            value={<AnimatedCounter value={videos.length || 3} />}
            subtitle="Curated by FIC Faculty"
            accent="violet"
            trend="High-Impact Video"
            icon={<VideoIcon size={17} />}
          />
        </StaggerItem>
        <StaggerItem>
          <WorkspaceKpi
            title="Accredited Mentors"
            value={<AnimatedCounter value={mentors.length || 2} />}
            subtitle="Industry & Academic Leaders"
            accent="coral"
            trend="1-on-1 Ready"
            icon={<CalendarIcon size={17} />}
          />
        </StaggerItem>
        <StaggerItem>
          <WorkspaceKpi
            title="Skill Domains"
            value={<AnimatedCounter value={uniqueSubjects.length || 3} />}
            subtitle="Architecture, Web, Careers"
            accent="amber"
            trend="Industry Tracks"
            icon={<RocketIcon size={17} />}
          />
        </StaggerItem>
        <StaggerItem>
          <WorkspaceKpi
            title="Student Mentees"
            value="48 Active"
            subtitle="Cross-College Cohort"
            accent="emerald"
            trend="Tamil Nadu Circle"
            icon={<ShieldCheckIcon size={17} />}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* 3. FILTERS & SEARCH TOOLBAR */}
      <WorkspaceCard variant="glass" padded={false} className="overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-[#EDE2D7] bg-white/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#82776E]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search masterclasses by topic, title, mentor..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/90 border border-[#EDE2D7] text-[#51463F] placeholder-[#82776E] focus:outline-hidden focus:border-[#8064A9] shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#82776E]">Student Level:</span>
            {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ALL_LEVELS'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${selectedLevel === lvl
                    ? 'bg-[#8064A9] text-white border-[#8064A9] shadow-2xs'
                    : 'bg-white/80 text-[#51463F] border-[#EDE2D7] hover:border-[#8064A9]/40'
                  }`}
              >
                {lvl === 'ALL' ? 'All Levels' : lvl.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Subject pills */}
        <div className="px-4 py-2.5 bg-[#FAF7F2]/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-[#82776E] shrink-0">Topics:</span>
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md shrink-0 transition-colors cursor-pointer ${selectedSubject === 'ALL'
                ? 'bg-[#51463F] text-white'
                : 'bg-white border border-[#EDE2D7] text-[#51463F] hover:bg-[#FAF7F2]'
              }`}
          >
            All Topics ({videos.length})
          </button>
          {uniqueSubjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md shrink-0 transition-colors cursor-pointer ${selectedSubject === sub
                  ? 'bg-[#8064A9] text-white'
                  : 'bg-white border border-[#EDE2D7] text-[#51463F] hover:bg-[#FAF7F2]'
                }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </WorkspaceCard>

      {/* 4. MASTERCLASS VIDEO LIBRARY GRID */}
      {filteredVideos.length === 0 ? (
        <WorkspaceEmptyState
          icon={<VideoIcon size={32} />}
          title="No masterclasses found"
          description="Try modifying your search keywords or topic filters."
          actionText="Clear Filters"
          onAction={() => {
            setSelectedSubject('ALL');
            setSelectedLevel('ALL');
            setSearchQuery('');
          }}
          accent="violet"
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-4.5">
          {filteredVideos.map((video) => (
            <StaggerItem key={video.id || video._id}>
              <WorkspaceCard
                variant="default"
                padded={false}
                className="overflow-hidden h-full flex flex-col justify-between group border border-[#EDE2D7]"
              >
                <div>
                  {/* Video Thumbnail with duration overlay */}
                  <div className="relative aspect-video w-full bg-[#3D312A] overflow-hidden">
                    <img
                      src={
                        video.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Play Badge Overlay */}
                    <button
                      onClick={() => handleWatchVideo(video)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/90 text-[#8064A9] flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                      title="Watch Masterclass"
                    >
                      <VideoIcon size={20} className="ml-0.5" />
                    </button>

                    {/* Duration pill */}
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-[10.5px] font-black text-white bg-black/75 rounded-md backdrop-blur-xs flex items-center gap-1">
                      <ClockIcon size={11} /> {video.duration || '15:00'}
                    </span>

                    {/* Student level & language pill */}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-black uppercase text-white bg-[#8064A9]/85 rounded-md backdrop-blur-xs">
                      {video.studentLevel?.replace('_', ' ') || 'ALL LEVELS'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 sm:p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#E8795B]">
                        {video.subject}
                      </span>
                      <span className="text-[10.5px] text-[#82776E] flex items-center gap-1 font-semibold">
                        <SparklesIcon size={12} className="text-[#E5A23B]" />
                        {video.viewsCount || 0} views
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-[#51463F] group-hover:text-[#8064A9] transition-colors leading-snug line-clamp-2">
                      {video.title}
                    </h3>

                    <p className="text-xs text-[#5A4F47] font-medium leading-relaxed line-clamp-2">
                      {video.description}
                    </p>

                    {/* Mentor Attribution */}
                    <div className="pt-2 border-t border-[#EDE2D7]/70 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#8064A9]/20 text-[#8064A9] flex items-center justify-center font-black text-[11px]">
                          {video.mentorName.charAt(0)}
                        </div>
                        <span className="font-bold text-[#51463F] text-xs">
                          {video.mentorName}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-[#82776E]">
                        {video.language}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3.5 sm:p-4 bg-[#FAF7F2]/60 border-t border-[#EDE2D7] grid grid-cols-2 gap-2">
                  <WorkspaceButton
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleWatchVideo(video)}
                  >
                    Watch Masterclass
                  </WorkspaceButton>
                  <WorkspaceButton
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleBookMentor(video.mentorId, video.mentorName)}
                  >
                    Book This Mentor
                  </WorkspaceButton>
                </div>
              </WorkspaceCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* 5. ACCREDITED MENTORS DIRECTORY SHOWCASE */}
      <WorkspaceCard variant="glass" padded={false} className="overflow-hidden mt-6">
        <div className="px-4 sm:px-5 py-3 border-b border-[#EDE2D7] bg-white/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8064A9]" />
            <h2 className="text-xs sm:text-sm font-black text-[#51463F]">
              Accredited Mentors Available for 1-on-1 Strategy Calls
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-[#82776E]">
            Verified FIC Academic Faculty
          </span>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {mentors.map((mentor) => (
            <div
              key={mentor._id}
              className="p-3.5 sm:p-4 rounded-xl border border-[#EDE2D7] bg-white/90 hover:border-[#8064A9] transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8064A9] to-[#6E529F] text-white flex items-center justify-center font-black text-sm shadow-xs">
                    {mentor.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#51463F]">
                      {mentor.fullName}
                    </h4>
                    <p className="text-xs text-[#82776E]">{mentor.organization}</p>
                    <p className="text-[11px] text-[#8064A9] font-bold mt-0.5">
                      {mentor.experience}
                    </p>
                  </div>
                </div>
                <WorkspaceBadge variant="active">Verified Mentor</WorkspaceBadge>
              </div>

              {mentor.services && mentor.services.length > 0 && (
                <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE2D7]/70 text-xs text-[#51463F] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#82776E] block">
                    Specialized Coaching:
                  </span>
                  {mentor.services.map((svc: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 font-semibold text-xs text-[#51463F]">
                      <CheckCircleIcon size={12} className="text-[#3B9C91]" />
                      <span>{svc.title}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[#EDE2D7] flex items-center justify-between">
                <span className="text-xs text-[#82776E]">45 min Virtual Meet</span>
                <WorkspaceButton
                  variant="primary"
                  size="sm"
                  icon={<CalendarIcon size={13} />}
                  onClick={() => handleBookMentor(mentor._id, mentor.fullName)}
                >
                  Schedule Consultation
                </WorkspaceButton>
              </div>
            </div>
          ))}
        </div>
      </WorkspaceCard>

      {/* 6. WATCH MASTERCLASS MODAL */}
      <AnimatedModal
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        title={activeVideo?.title || 'Masterclass Video'}
        maxWidth="max-w-3xl"
      >
        {activeVideo && (
          <div className="space-y-4">
            {/* Embedded Video Player: HTML5 Video for Uploaded Files, iframe for Embeds */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md flex items-center justify-center">
              {activeVideo.videoUrl &&
              (activeVideo.videoUrl.includes('/uploads/') ||
                activeVideo.videoUrl.startsWith('blob:') ||
                activeVideo.videoUrl.endsWith('.mp4') ||
                activeVideo.videoUrl.endsWith('.webm') ||
                activeVideo.videoUrl.endsWith('.mov') ||
                activeVideo.videoUrl.endsWith('.mkv') ||
                activeVideo.videoUrl.endsWith('.avi')) ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  src={
                    activeVideo.videoUrl.startsWith('/uploads')
                      ? `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/v1\/?$/, '')}${activeVideo.videoUrl}`
                      : activeVideo.videoUrl
                  }
                  className="w-full h-full object-contain bg-black"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={activeVideo.videoUrl}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Video Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-[#EDE2D7] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8064A9]">
                  {activeVideo.subject}
                </span>
                <h3 className="text-base font-black text-[#51463F]">
                  {activeVideo.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {activeVideo.language && (
                  <WorkspaceBadge variant="neutral">
                    {activeVideo.language}
                  </WorkspaceBadge>
                )}
                <WorkspaceBadge variant="active">
                  <ClockIcon size={11} className="mr-1 inline" /> {activeVideo.duration}
                </WorkspaceBadge>
                {activeVideo.studentLevel && (
                  <WorkspaceBadge variant="pending">
                    {activeVideo.studentLevel.replace('_', ' ')}
                  </WorkspaceBadge>
                )}
              </div>
            </div>

            <p className="text-xs text-[#51463F] leading-relaxed">
              {activeVideo.description}
            </p>

            {/* Learning Objectives Checklist */}
            {activeVideo.learningObjectives && activeVideo.learningObjectives.length > 0 && (
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#EDE2D7] space-y-2">
                <h4 className="text-xs font-black text-[#51463F] flex items-center gap-1.5">
                  <CheckCircleIcon size={14} className="text-[#3B9C91]" />
                  What You'll Learn in This Masterclass:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {activeVideo.learningObjectives.map((obj: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#51463F]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8064A9] shrink-0" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentor Call to Action Card inside modal */}
            <div className="p-3.5 rounded-xl bg-white border border-[#EDE2D7] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#8064A9]/20 text-[#8064A9] flex items-center justify-center font-black text-sm">
                  {activeVideo.mentorName.charAt(0)}
                </div>
                <div>
                  <strong className="text-xs font-black text-[#51463F] block">
                    {activeVideo.mentorName}
                  </strong>
                  <span className="text-[11px] text-[#82776E]">
                    Have doubts about this topic? Ask directly in a 1-on-1 call.
                  </span>
                </div>
              </div>
              <WorkspaceButton
                variant="primary"
                size="sm"
                icon={<CalendarIcon size={13} />}
                onClick={() => {
                  const mId = activeVideo.mentorId;
                  const mName = activeVideo.mentorName;
                  setActiveVideo(null);
                  handleBookMentor(mId, mName);
                }}
              >
                Book This Mentor
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>
    </WorkspaceShell>
  );
};
