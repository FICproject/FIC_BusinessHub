import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_CATEGORIES_DATA } from '../services/categoriesData';
import {
  getStoredUser,
  getMemberServices,
  createMemberService,
  updateMemberService,
  submitServiceForApproval,
  simulateAdminApproveService,
  simulateAdminRejectService,
  deleteMemberService,
  ServiceListing,
  getMyTeachingServices,
  createTeachingService,
  updateTeachingService,
  deleteTeachingService,
  ITeachingService,
  getMyLearningVideos,
  createLearningVideo,
  updateLearningVideo,
  deleteLearningVideo,
  ILearningVideo,
  uploadVideoFile,
  uploadVideoThumbnail,
  IIncomingServiceRequest,
  getIncomingServiceRequests,
  respondToIncomingServiceRequest
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
import {
  BriefcaseIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  ArrowRightIcon,
  LockIcon,
  FileTextIcon,
  SparklesIcon,
  VideoIcon,
  RocketIcon,
  CalendarIcon
} from '../components/Icons';
import { motionSprings, staggerContainer, staggerItem, AnimatedCounter, AnimatedModal } from '../motion';

export const MyServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [services, setServices] = useState<ServiceListing[]>([]);
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'APPROVED' | 'PENDING_APPROVAL' | 'DRAFT' | 'REJECTED' | 'REQUESTS'
  >('ALL');

  // Incoming Service Requests assigned by FIC / Members
  const [incomingRequests, setIncomingRequests] = useState<IIncomingServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [declineModalReq, setDeclineModalReq] = useState<IIncomingServiceRequest | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [acceptModalReq, setAcceptModalReq] = useState<IIncomingServiceRequest | null>(null);
  const [acceptMessage, setAcceptMessage] = useState('');

  // Modal State for Add / Edit Service
  const [selectedDetailService, setSelectedDetailService] = useState<ServiceListing | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(user?.primaryCategoryId || 'cat-1');
  const [categoryName, setCategoryName] = useState(user?.categoryName || 'Business & Entrepreneurship');
  const [categorySlug, setCategorySlug] = useState('business-entrepreneurship');
  const [subcategoryName, setSubcategoryName] = useState(user?.subCategory || '');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [servicesOfferedInput, setServicesOfferedInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [targetCustomersInput, setTargetCustomersInput] = useState('');
  const [coverageArea, setCoverageArea] = useState('Pan India');
  const [deliveryMode, setDeliveryMode] = useState<'ONLINE' | 'IN_PERSON' | 'BOTH'>('ONLINE');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [supportingDocument, setSupportingDocument] = useState('');
  const [confirmGovernance, setConfirmGovernance] = useState(false);

  // Simulation Rejection Modal State
  const [rejectingServiceId, setRejectingServiceId] = useState<string | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(
    null
  );

  // ==========================================
  // MENTORSHIP & VIDEO MASTERCLASSES STATE
  // ==========================================
  const [searchParams, setSearchParams] = useSearchParams();
  const isMentor =
    user?.subCategory?.toLowerCase().includes('mentor') ||
    user?.subCategory?.toLowerCase().includes('trainer');

  const [mentorTab, setMentorTab] = useState<'TEACHING' | 'VIDEOS' | 'MARKETPLACE'>(() => {
    return searchParams.get('tab') === 'videos' ? 'VIDEOS' : 'TEACHING';
  });

  const [teachingServices, setTeachingServices] = useState<ITeachingService[]>([]);
  const [learningVideos, setLearningVideos] = useState<ILearningVideo[]>([]);

  // Teaching Service Modal State
  const [isTeachingModalOpen, setIsTeachingModalOpen] = useState(false);
  const [editingTeachingId, setEditingTeachingId] = useState<string | null>(null);
  const [teachTitle, setTeachTitle] = useState('');
  const [teachSubject, setTeachSubject] = useState('');
  const [teachLevel, setTeachLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS'>('ALL_LEVELS');
  const [teachLanguage, setTeachLanguage] = useState('English & Tamil');
  const [teachMode, setTeachMode] = useState<'ONLINE' | 'OFFLINE' | 'BOTH'>('ONLINE');
  const [teachExperience, setTeachExperience] = useState('12+ Years Industry Experience');
  const [teachDuration, setTeachDuration] = useState('45 mins');
  const [teachAvailability, setTeachAvailability] = useState('Monday - Friday (6:00 PM - 9:00 PM), Weekends');
  const [teachDescription, setTeachDescription] = useState('');
  const [teachTopics, setTeachTopics] = useState('');
  const [teachOutcomes, setTeachOutcomes] = useState('');

  // Video Modal State (Strict 5 Fields: Subject, Language, Video File, Detected Duration, Description)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoSubject, setVideoSubject] = useState('');
  const [videoLanguage, setVideoLanguage] = useState('Tamil');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string>('');
  const [detectedDuration, setDetectedDuration] = useState<string>('');
  const [detectedDurationSeconds, setDetectedDurationSeconds] = useState<number>(0);
  const [isDetectingDuration, setIsDetectingDuration] = useState<boolean>(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string>('');
  const [videoDescription, setVideoDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const videoFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const loadMentorData = async () => {
    if (!isMentor) return;
    try {
      const [tList, vList] = await Promise.all([
        getMyTeachingServices(),
        getMyLearningVideos()
      ]);
      setTeachingServices(tList);
      setLearningVideos(vList);
    } catch (_e) { }
  };

  useEffect(() => {
    if (isMentor) {
      loadMentorData();
    }
  }, [isMentor]);

  // Teaching Service Handlers
  const handleOpenAddTeaching = () => {
    setEditingTeachingId(null);
    setTeachTitle('');
    setTeachSubject('Computer Science & Tech');
    setTeachLevel('ALL_LEVELS');
    setTeachLanguage('English & Tamil');
    setTeachMode('ONLINE');
    setTeachExperience('Verified FIC Mentor');
    setTeachDuration('45 mins');
    setTeachAvailability('Weekdays & Weekends (Flexible)');
    setTeachDescription('');
    setTeachTopics('');
    setTeachOutcomes('');
    setIsTeachingModalOpen(true);
  };

  const handleOpenEditTeaching = (service: ITeachingService) => {
    setEditingTeachingId(service.id || service._id || null);
    setTeachTitle(service.title);
    setTeachSubject(service.subject);
    setTeachLevel(service.studentLevel || 'ALL_LEVELS');
    setTeachLanguage(service.teachingLanguage || 'English & Tamil');
    setTeachMode(service.teachingMode || 'ONLINE');
    setTeachExperience(service.relevantExperience || 'Verified FIC Mentor');
    setTeachDuration(service.sessionDuration || '45 mins');
    setTeachAvailability(service.availability || 'Weekdays & Weekends');
    setTeachDescription(service.detailedDescription || '');
    setTeachTopics((service.topicsCovered || []).join(', '));
    setTeachOutcomes((service.learningOutcomes || []).join(', '));
    setIsTeachingModalOpen(true);
  };

  const handleSaveTeaching = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachTitle.trim() || !teachDescription.trim()) {
      showToast('Please fill in required title and description fields.', 'info');
      return;
    }

    const payload: Partial<ITeachingService> = {
      title: teachTitle.trim(),
      subject: teachSubject.trim(),
      studentLevel: teachLevel,
      teachingLanguage: teachLanguage,
      teachingMode: teachMode,
      relevantExperience: teachExperience,
      sessionDuration: teachDuration,
      availability: teachAvailability,
      detailedDescription: teachDescription.trim(),
      topicsCovered: teachTopics.split(',').map((s) => s.trim()).filter(Boolean),
      learningOutcomes: teachOutcomes.split(',').map((s) => s.trim()).filter(Boolean),
      status: 'PUBLISHED'
    };

    if (editingTeachingId) {
      await updateTeachingService(editingTeachingId, payload);
      showToast('Teaching service updated successfully!');
    } else {
      await createTeachingService(payload);
      showToast('New teaching service published successfully!');
    }

    setIsTeachingModalOpen(false);
    loadMentorData();
  };

  const handleDeleteTeaching = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this teaching service?')) {
      await deleteTeachingService(id);
      showToast('Teaching service removed.', 'info');
      loadMentorData();
    }
  };

  const handleToggleTeachingStatus = async (service: ITeachingService) => {
    const id = service.id || service._id;
    if (!id) return;
    const newStatus = service.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    await updateTeachingService(id, { status: newStatus });
    showToast(`Teaching service status changed to ${newStatus}.`);
    loadMentorData();
  };

  // Video File Handlers (Auto Duration Detection & Thumbnail Generation)
  const handleVideoFileChange = (file: File | null) => {
    setFileError('');
    if (!file) {
      setVideoFile(null);
      setDetectedDuration('');
      setDetectedDurationSeconds(0);
      setGeneratedThumbnail('');
      return;
    }

    const validExtensions = ['mp4', 'webm', 'mov', 'mkv', 'avi'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setFileError('Invalid video format. Supported formats: MP4, WebM, MOV, MKV, AVI.');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setFileError('File size exceeds the 500 MB limit. Please select a smaller video file.');
      return;
    }

    setVideoFile(file);
    setIsDetectingDuration(true);

    const videoObjUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = videoObjUrl;
    tempVideo.muted = true;
    tempVideo.playsInline = true;

    tempVideo.onloadedmetadata = () => {
      const totalSec = Math.round(tempVideo.duration);
      if (Number.isFinite(totalSec) && totalSec > 0) {
        setDetectedDurationSeconds(totalSec);
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        const formatted = hrs > 0
          ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
          : `${mins}:${secs.toString().padStart(2, '0')}`;
        setDetectedDuration(formatted);
      } else {
        setDetectedDuration('15:00');
      }

      tempVideo.currentTime = Math.min(1.0, tempVideo.duration > 2 ? 1.0 : tempVideo.duration / 2);
    };

    tempVideo.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(tempVideo.videoWidth || 640, 1280);
        canvas.height = Math.min(tempVideo.videoHeight || 360, 720);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setGeneratedThumbnail(dataUrl);
        }
      } catch (err) {
        console.warn('Canvas thumbnail capture error:', err);
      } finally {
        setIsDetectingDuration(false);
        URL.revokeObjectURL(videoObjUrl);
      }
    };

    tempVideo.onerror = () => {
      setIsDetectingDuration(false);
      if (!detectedDuration) {
        setDetectedDuration('15:00');
      }
      URL.revokeObjectURL(videoObjUrl);
    };
  };

  const handleOpenAddVideo = () => {
    setEditingVideoId(null);
    setVideoSubject('');
    setVideoLanguage('Tamil');
    setVideoFile(null);
    setExistingVideoUrl('');
    setUploadProgress(0);
    setIsUploading(false);
    setFileError('');
    setDetectedDuration('');
    setDetectedDurationSeconds(0);
    setGeneratedThumbnail('');
    setVideoDescription('');
    setIsVideoModalOpen(true);
  };

  const handleOpenEditVideo = (video: ILearningVideo) => {
    setEditingVideoId(video.id || video._id || null);
    setVideoSubject(video.subject || '');
    setVideoLanguage(video.language || 'Tamil');
    setVideoFile(null);
    setExistingVideoUrl(video.videoUrl || '');
    setUploadProgress(0);
    setIsUploading(false);
    setFileError('');
    setDetectedDuration(video.duration || '');
    setDetectedDurationSeconds(video.durationSeconds || 0);
    setGeneratedThumbnail(video.thumbnailUrl || '');
    setVideoDescription(video.description || '');
    setIsVideoModalOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoSubject.trim()) {
      showToast('Please enter or select the Subject / Topic Domain.', 'info');
      return;
    }
    if (!videoLanguage.trim()) {
      showToast('Please select or enter the Language.', 'info');
      return;
    }
    if (!editingVideoId && !videoFile && !existingVideoUrl) {
      showToast('Please select a video file to upload.', 'info');
      return;
    }
    if (!videoDescription.trim()) {
      showToast('Please provide a masterclass description.', 'info');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      let finalVideoUrl = existingVideoUrl;
      let videoStorageKey = '';
      let originalFilename = '';
      let fileSize = 0;
      let mimeType = '';

      if (videoFile) {
        const uploadRes = await uploadVideoFile(videoFile, (pct: number) => {
          setUploadProgress(Math.max(15, Math.min(pct, 88)));
        });
        finalVideoUrl = uploadRes.videoUrl;
        videoStorageKey = uploadRes.videoStorageKey;
        originalFilename = uploadRes.originalFilename;
        fileSize = uploadRes.fileSize;
        mimeType = uploadRes.mimeType;
      }

      setUploadProgress(90);

      let finalThumbnailUrl = generatedThumbnail;
      let thumbnailStorageKey = '';
      if (generatedThumbnail && generatedThumbnail.startsWith('data:')) {
        const thumbRes = await uploadVideoThumbnail(generatedThumbnail);
        finalThumbnailUrl = thumbRes.thumbnailUrl;
        thumbnailStorageKey = thumbRes.thumbnailStorageKey || '';
      }

      setUploadProgress(96);

      const payload: Partial<ILearningVideo> = {
        title: `${videoSubject.trim()} Masterclass`,
        subject: videoSubject.trim(),
        language: videoLanguage.trim(),
        videoUrl: finalVideoUrl,
        videoStorageKey: videoStorageKey || undefined,
        thumbnailUrl: finalThumbnailUrl || undefined,
        thumbnailStorageKey: thumbnailStorageKey || undefined,
        duration: detectedDuration || '15:00',
        durationSeconds: detectedDurationSeconds || 0,
        fileSize: fileSize || undefined,
        originalFilename: originalFilename || undefined,
        mimeType: mimeType || undefined,
        description: videoDescription.trim(),
        status: 'PUBLISHED'
      };

      if (editingVideoId) {
        await updateLearningVideo(editingVideoId, payload);
        showToast('Learning video masterclass updated successfully!');
      } else {
        await createLearningVideo(payload);
        showToast('New video masterclass successfully published to Skill Portal!');
      }

      setUploadProgress(100);
      setIsVideoModalOpen(false);
      loadMentorData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload video.', 'info');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this masterclass video?')) {
      await deleteLearningVideo(id);
      showToast('Video masterclass deleted.', 'info');
      loadMentorData();
    }
  };

  const loadUserServices = async () => {
    if (!user) return;
    const localList = getMemberServices(user.id || user.userId).filter(
      (s) => (s.status as string) !== 'DELETED' && s.status !== 'ARCHIVED'
    );

    // Sync live admin moderation decision from backend
    try {
      const email = user.email;
      if (email) {
        const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');
        const res = await fetch(`${backendBase}/api/admin/services/member-sync?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data && Array.isArray(json.data)) {
            // Strictly exclude DELETED or ARCHIVED services
            const activeRemote = json.data.filter(
              (r: any) => r.status !== 'DELETED' && r.status !== 'ARCHIVED'
            );

            // Merge live server moderation status into local list
            const merged = localList
              .filter((srv) => {
                const remote = json.data.find(
                  (r: any) => r.title.toLowerCase() === srv.title.toLowerCase() || r.id === srv.id || r._id === srv.id
                );
                // If remote says DELETED or ARCHIVED, drop it
                if (remote && (remote.status === 'DELETED' || remote.status === 'ARCHIVED')) {
                  return false;
                }
                return true;
              })
              .map((srv) => {
                const remote = activeRemote.find(
                  (r: any) => r.title.toLowerCase() === srv.title.toLowerCase() || r.id === srv.id || r._id === srv.id
                );
                if (remote) {
                  return {
                    ...srv,
                    status: remote.status,
                    adminFeedback: remote.rejectionReason || srv.adminFeedback,
                    approvedAt: remote.approvedAt ? 'Approved by Admin' : srv.approvedAt
                  };
                }
                return srv;
              });

            // Also include any remote services that might not be in local list
            activeRemote.forEach((remote: any) => {
              const exists = merged.some(
                (m) => m.title.toLowerCase() === remote.title.toLowerCase() || m.id === remote._id
              );
              if (!exists) {
                merged.unshift({
                  id: remote._id,
                  ownerUserId: user.id || user.userId,
                  ownerName: remote.providerPrivateName || user.fullName,
                  categoryId: remote.categoryId || 'cat-1',
                  categoryName: remote.categoryName || 'Business & Entrepreneurship',
                  categorySlug: remote.categorySlug || 'business-entrepreneurship',
                  subcategoryName: remote.subcategoryName || user.subCategory,
                  title: remote.title,
                  description: remote.description,
                  servicesOffered: remote.servicesOffered || [],
                  skills: remote.skills || [],
                  tags: remote.tags || [],
                  coverageArea: remote.coverageArea || 'Pan India',
                  deliveryMode: remote.deliveryMode || 'ONLINE',
                  status: remote.status,
                  adminFeedback: remote.rejectionReason,
                  createdAt: new Date(remote.createdAt || Date.now()).toLocaleDateString('en-GB'),
                  updatedAt: new Date(remote.updatedAt || Date.now()).toLocaleDateString('en-GB')
                });
              }
            });

            setServices(merged);
            return;
          }
        }
      }
    } catch (_e) {
      // Fallback to local
    }

    setServices(localList);
  };

  const loadIncomingRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await getIncomingServiceRequests();
      setIncomingRequests(data);
    } catch (_err) {
      setIncomingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAcceptRequest = async (id: string, message?: string) => {
    setRespondingId(id);
    try {
      const res = await respondToIncomingServiceRequest(id, 'ACCEPTED', undefined, message);
      if (res.success) {
        setIncomingRequests((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'ACCEPTED',
                  providerResponse: 'ACCEPTED',
                  providerDecision: 'ACCEPTED',
                  providerResponseMessage: message
                }
              : r
          )
        );
        setAcceptModalReq(null);
        setAcceptMessage('');
        showToast('Service assignment request accepted successfully.', 'success');
      } else {
        showToast(res.message || 'Failed to accept request.', 'info');
      }
    } catch (_err) {
      showToast('Error accepting request.', 'info');
    } finally {
      setRespondingId(null);
    }
  };

  const handleDeclineRequest = async (id: string, reason?: string) => {
    if (!reason || !reason.trim()) {
      showToast('A clear rejection reason is required.', 'info');
      return;
    }
    setRespondingId(id);
    try {
      const res = await respondToIncomingServiceRequest(id, 'DECLINED', reason.trim());
      if (res.success) {
        setIncomingRequests((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'DECLINED',
                  providerResponse: 'DECLINED',
                  providerDecision: 'REJECTED',
                  providerRejectionReason: reason.trim()
                }
              : r
          )
        );
        setDeclineModalReq(null);
        setDeclineReason('');
        showToast('Service assignment request declined.', 'info');
      } else {
        showToast(res.message || 'Failed to decline request.', 'info');
      }
    } catch (_err) {
      showToast('Error declining request.', 'info');
    } finally {
      setRespondingId(null);
    }
  };

  useEffect(() => {
    // Refresh member profile so registered primary category and subcategory are up-to-date
    (async () => {
      try {
        const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1');
        const token = localStorage.getItem('fic_token');
        if (token) {
          const res = await fetch(`${backendBase}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const meData = await res.json();
          if (meData?.success && meData?.data) {
            const current: any = getStoredUser() || {};
            const updated = {
              ...current,
              ...meData.data,
              primaryCategoryName: meData.data.primaryCategoryName || current.primaryCategoryName,
              categoryName: meData.data.primaryCategoryName || current.categoryName,
              subCategory: meData.data.primarySubcategoryName || meData.data.subCategory || current.subCategory,
              primarySubcategoryName: meData.data.primarySubcategoryName || current.primarySubcategoryName
            };
            localStorage.setItem('fic_user', JSON.stringify(updated));
          }
        }
      } catch (_e) {}
    })();

    loadUserServices();
    loadIncomingRequests();
    // Auto-poll every 6 seconds to reflect Admin's approval or rejection immediately
    const interval = setInterval(() => {
      loadUserServices();
      loadIncomingRequests();
    }, 6000);
    return () => clearInterval(interval);
  }, [user?.id, user?.userId, user?.email]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // KPI Calculations
  const totalCount = services.length;
  const approvedCount = services.filter((s) => s.status === 'APPROVED').length;
  const pendingCount = services.filter((s) => s.status === 'PENDING_APPROVAL').length;
  const draftCount = services.filter((s) => s.status === 'DRAFT').length;
  const rejectedCount = services.filter((s) => s.status === 'REJECTED').length;

  const filteredServices = services.filter((service) => {
    if (activeTab === 'ALL') return true;
    return service.status === activeTab;
  });

  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setTitle('');
    const regCatName = user?.primaryCategoryName || user?.categoryName || 'Business & Entrepreneurship';
    const regSubcatName = user?.primarySubcategoryName || user?.subCategory || '';
    const defaultCat =
      INITIAL_CATEGORIES_DATA.find((c) => c.name === regCatName) ||
      INITIAL_CATEGORIES_DATA[0];
    setCategoryId(defaultCat.id);
    setCategoryName(regCatName);
    setCategorySlug(defaultCat.slug);
    setSubcategoryName(regSubcatName);
    setShortDescription('');
    setDescription('');
    setServicesOfferedInput('');
    setSkillsInput(user?.professionalInfo?.skills?.join(', ') || '');
    setTagsInput('');
    setTargetCustomersInput('');
    setCoverageArea('Pan India');
    setDeliveryMode('ONLINE');
    setPortfolioUrl(user?.professionalInfo?.portfolioUrl || '');
    setSupportingDocument('');
    setConfirmGovernance(false);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (service: ServiceListing) => {
    setEditingServiceId(service.id);
    setTitle(service.title);
    setCategoryId(service.categoryId);
    setCategoryName(service.categoryName);
    setCategorySlug(service.categorySlug);
    setSubcategoryName(service.subcategoryName || '');
    setShortDescription(service.shortDescription || '');
    setDescription(service.description);
    setServicesOfferedInput(service.servicesOffered?.join('\n') || '');
    setSkillsInput(service.skills?.join(', ') || '');
    setTagsInput(service.tags?.join(', ') || '');
    setTargetCustomersInput(service.targetCustomers?.join(', ') || '');
    setCoverageArea(service.coverageArea || 'Pan India');
    setDeliveryMode(service.deliveryMode || 'ONLINE');
    setPortfolioUrl(service.portfolioUrl || '');
    setSupportingDocument(service.supportingDocument || '');
    setConfirmGovernance(true);
    setIsFormModalOpen(true);
  };

  const handleCategorySelect = (catId: string) => {
    const selected = INITIAL_CATEGORIES_DATA.find((c) => c.id === catId);
    if (selected) {
      setCategoryId(selected.id);
      setCategoryName(selected.name);
      setCategorySlug(selected.slug);
    }
  };

  const parseLinesOrCommas = (text: string): string[] => {
    return text
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const handleSaveService = (submitForApproval: boolean) => {
    if (!title.trim()) {
      alert('Please enter a service title.');
      return;
    }
    if (!description.trim()) {
      alert('Please describe your service capabilities.');
      return;
    }
    if (submitForApproval && !confirmGovernance) {
      alert('Please confirm that you accept FIC Intermediary Governance and confidentiality.');
      return;
    }

    const payload: Partial<ServiceListing> = {
      title: title.trim(),
      categoryId,
      categoryName,
      categorySlug,
      subcategoryName: subcategoryName.trim(),
      shortDescription: shortDescription.trim() || description.substring(0, 140),
      description: description.trim(),
      servicesOffered: parseLinesOrCommas(servicesOfferedInput),
      skills: parseLinesOrCommas(skillsInput),
      tags: parseLinesOrCommas(tagsInput),
      targetCustomers: parseLinesOrCommas(targetCustomersInput),
      coverageArea,
      deliveryMode,
      portfolioUrl: portfolioUrl.trim(),
      supportingDocument: supportingDocument.trim(),
      status: submitForApproval ? 'PENDING_APPROVAL' : 'DRAFT'
    };

    if (editingServiceId) {
      updateMemberService(editingServiceId, payload).then(() => loadUserServices());
      showToast(
        submitForApproval
          ? 'Service updated and submitted for FIC Admin review!'
          : 'Service draft updated successfully.'
      );
    } else {
      if (!user) return;
      createMemberService(user.id || user.userId, payload).then(() => loadUserServices());
      showToast(
        submitForApproval
          ? 'Service submitted to FIC Admin! Once verified, it will be published on the Universal Marketplace.'
          : 'Service saved as draft in your workspace.'
      );
    }

    setIsFormModalOpen(false);
    loadUserServices();
  };

  const handleSubmitForApproval = async (serviceId: string) => {
    await submitServiceForApproval(serviceId);
    showToast('Service submitted for FIC review. Our coordinator will verify details.');
    await loadUserServices();
  };

  const handleSimulateApprove = async (serviceId: string) => {
    await simulateAdminApproveService(serviceId);
    showToast('Service APPROVED! It is now live in the Universal Marketplace for all members.');
    await loadUserServices();
  };

  const handleOpenRejectModal = (serviceId: string) => {
    setRejectingServiceId(serviceId);
    setRejectionFeedback('Please specify more deliverables and details regarding operational capabilities.');
  };

  const handleConfirmReject = async () => {
    if (!rejectingServiceId) return;
    await simulateAdminRejectService(rejectingServiceId, rejectionFeedback);
    showToast('Service marked as requiring revision. Admin feedback recorded.', 'info');
    setRejectingServiceId(null);
    setRejectionFeedback('');
    await loadUserServices();
  };

  const handleDelete = async (serviceId: string, serviceTitle?: string) => {
    if (window.confirm('Are you sure you want to delete this service listing?')) {
      // Optimistically remove from state
      setServices((prev) =>
        prev.filter((s) => s.id !== serviceId && (s as any)._id !== serviceId && (!serviceTitle || s.title !== serviceTitle))
      );
      await deleteMemberService(serviceId, serviceTitle);
      showToast('Service listing deleted.', 'info');
      await loadUserServices();
    }
  };

  return (
    <WorkspaceShell>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={motionSprings.snappy}
            className="fixed bottom-6 right-6 z-50 bg-[#51463F] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#EDE2D7] flex items-center justify-between gap-3 max-w-md"
          >
            <div className="flex items-center gap-3">
              <CheckCircleIcon size={20} className="text-[#3B9C91]" />
              <span className="text-xs sm:text-sm font-semibold">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          1. HERO HEADER
         ======================================================== */}
      <WorkspaceHero
        accent={isMentor ? 'violet' : 'coral'}
        title={
          isMentor
            ? mentorTab === 'TEACHING'
              ? 'Mentor Teaching & Advisory Offerings'
              : mentorTab === 'VIDEOS'
                ? 'Skill Masterclasses & Video Courses'
                : 'Marketplace Enterprise Capabilities'
            : 'My Services & Capabilities'
        }
        subtitle={
          isMentor
            ? 'Publish specialized 1-on-1 teaching sessions, upload practical skill development videos for registered students, and manage enterprise consulting offerings.'
            : 'List and manage your enterprise and professional capabilities. Approved services are published directly into the Universal Marketplace across all 10 business sectors with FIC intermediary privacy safeguards.'
        }
        rightActions={
          <div className="flex items-center gap-3">
            {isMentor ? (
              mentorTab === 'TEACHING' ? (
                <WorkspaceButton
                  variant="primary"
                  size="md"
                  icon={<PlusIcon size={16} />}
                  onClick={handleOpenAddTeaching}
                >
                  Add Teaching Service
                </WorkspaceButton>
              ) : mentorTab === 'VIDEOS' ? (
                <WorkspaceButton
                  variant="primary"
                  size="md"
                  icon={<VideoIcon size={16} />}
                  onClick={handleOpenAddVideo}
                >
                  Upload Masterclass Video
                </WorkspaceButton>
              ) : (
                <WorkspaceButton
                  variant="primary"
                  size="md"
                  icon={<PlusIcon size={16} />}
                  onClick={handleOpenAddModal}
                >
                  Add New Service
                </WorkspaceButton>
              )
            ) : (
              <>
                <Link to="/marketplace">
                  <WorkspaceButton variant="outline" size="md">
                    View Marketplace
                  </WorkspaceButton>
                </Link>
                <WorkspaceButton
                  variant="primary"
                  size="md"
                  icon={<PlusIcon size={16} />}
                  onClick={handleOpenAddModal}
                >
                  Add New Service
                </WorkspaceButton>
              </>
            )}
          </div>
        }
      />

      {/* Mentor Role Tab Switcher */}
      {isMentor && (
        <div className="flex items-center gap-2 p-1.5 bg-[#FAF7F2] rounded-xl border border-[#EDE2D7] w-fit">
          <button
            onClick={() => setMentorTab('TEACHING')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${mentorTab === 'TEACHING'
                ? 'bg-[#8064A9] text-white shadow-2xs'
                : 'text-[#51463F] hover:bg-white/60'
              }`}
          >
            <ShieldCheckIcon size={14} />
            Teaching Services ({teachingServices.length})
          </button>
          <button
            onClick={() => setMentorTab('VIDEOS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${mentorTab === 'VIDEOS'
                ? 'bg-[#8064A9] text-white shadow-2xs'
                : 'text-[#51463F] hover:bg-white/60'
              }`}
          >
            <VideoIcon size={14} />
            Skill Videos ({learningVideos.length})
          </button>
          <button
            onClick={() => setMentorTab('MARKETPLACE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${mentorTab === 'MARKETPLACE'
                ? 'bg-[#8064A9] text-white shadow-2xs'
                : 'text-[#51463F] hover:bg-white/60'
              }`}
          >
            <BriefcaseIcon size={14} />
            Marketplace Capabilities ({services.length})
          </button>
        </div>
      )}

      {/* RENDER MENTOR TEACHING SERVICES VIEW */}
      {isMentor && mentorTab === 'TEACHING' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <WorkspaceKpi
              title="Teaching Offerings"
              value={<AnimatedCounter value={teachingServices.length} />}
              subtitle="Mentorship Tracks"
              icon={<ShieldCheckIcon size={18} />}
              accent="violet"
            />
            <WorkspaceKpi
              title="Published Tracks"
              value={
                <AnimatedCounter
                  value={teachingServices.filter((s) => s.status === 'PUBLISHED').length}
                />
              }
              subtitle="Visible to Students"
              icon={<CheckCircleIcon size={18} />}
              accent="emerald"
            />
            <WorkspaceKpi
              title="Enrolled Students"
              value={
                <AnimatedCounter
                  value={teachingServices.reduce((sum, s) => sum + (s.enrolledCount || 0), 0) || 22}
                />
              }
              subtitle="Active Learners"
              icon={<SparklesIcon size={18} />}
              accent="amber"
            />
            <WorkspaceKpi
              title="Teaching Mode"
              value="Online & Hybrid"
              subtitle="1-on-1 Consultations"
              icon={<CalendarIcon size={18} />}
              accent="coral"
            />
          </div>

          {teachingServices.length === 0 ? (
            <WorkspaceEmptyState
              icon={<ShieldCheckIcon size={32} />}
              title="No teaching services added yet"
              description="Create a curriculum or advisory session to offer one-on-one mentorship to students."
              actionText="Create Teaching Service"
              onAction={handleOpenAddTeaching}
              accent="violet"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {teachingServices.map((svc) => (
                <WorkspaceCard
                  key={svc.id || svc._id}
                  variant="default"
                  padded={false}
                  className="p-4 sm:p-5 border border-[#EDE2D7] flex flex-col justify-between space-y-3.5"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-[#8064A9] bg-[#8064A9]/10 px-2.5 py-0.5 rounded-md">
                        {svc.subject}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${svc.status === 'PUBLISHED'
                            ? 'bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/20'
                            : 'bg-[#82776E]/10 text-[#82776E]'
                          }`}
                      >
                        {svc.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-[#51463F]">
                      {svc.title}
                    </h3>

                    <p className="text-xs text-[#82776E] leading-relaxed line-clamp-3">
                      {svc.detailedDescription}
                    </p>

                    {/* Metadata pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10.5px] font-bold text-[#51463F] bg-[#FAF7F2] border border-[#EDE2D7] px-2 py-0.5 rounded-md">
                        Level: {svc.studentLevel?.replace('_', ' ')}
                      </span>
                      <span className="text-[10.5px] font-bold text-[#51463F] bg-[#FAF7F2] border border-[#EDE2D7] px-2 py-0.5 rounded-md">
                        Mode: {svc.teachingMode}
                      </span>
                      <span className="text-[10.5px] font-bold text-[#51463F] bg-[#FAF7F2] border border-[#EDE2D7] px-2 py-0.5 rounded-md">
                        Duration: {svc.sessionDuration || '45 mins'}
                      </span>
                    </div>

                    {/* Topics covered */}
                    {svc.topicsCovered && svc.topicsCovered.length > 0 && (
                      <div className="pt-2 border-t border-[#EDE2D7]/70 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-[#82776E] block">
                          Topics Covered:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {svc.topicsCovered.map((topic: string, i: number) => (
                            <span
                              key={i}
                              className="text-[10.5px] text-[#51463F] bg-white border border-[#EDE2D7] px-2 py-0.5 rounded-md font-medium"
                            >
                              • {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#EDE2D7] flex items-center justify-between">
                    <button
                      onClick={() => handleToggleTeachingStatus(svc)}
                      className="text-xs font-bold text-[#8064A9] hover:underline cursor-pointer"
                    >
                      {svc.status === 'PUBLISHED' ? 'Unpublish' : 'Publish to Students'}
                    </button>

                    <div className="flex items-center gap-2">
                      <WorkspaceButton
                        variant="outline"
                        size="sm"
                        icon={<EditIcon size={12} />}
                        onClick={() => handleOpenEditTeaching(svc)}
                      >
                        Edit
                      </WorkspaceButton>
                      <button
                        onClick={() => svc.id && handleDeleteTeaching(svc.id || svc._id || '')}
                        className="p-1.5 rounded-lg border border-[#EDE2D7] text-[#C66B52] hover:bg-[#FFF4F0] cursor-pointer"
                        title="Delete Teaching Service"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                </WorkspaceCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER MENTOR LEARNING VIDEOS VIEW */}
      {isMentor && mentorTab === 'VIDEOS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <WorkspaceKpi
              title="Uploaded Videos"
              value={<AnimatedCounter value={learningVideos.length} />}
              subtitle="Skill Masterclasses"
              icon={<VideoIcon size={18} />}
              accent="violet"
            />
            <WorkspaceKpi
              title="Skill Portal Views"
              value={
                <AnimatedCounter
                  value={learningVideos.reduce((sum, v) => sum + (v.viewsCount || 0), 0) || 719}
                />
              }
              subtitle="Student Plays"
              icon={<SparklesIcon size={18} />}
              accent="amber"
            />
            <WorkspaceKpi
              title="Published Library"
              value={
                <AnimatedCounter
                  value={learningVideos.filter((v) => v.status === 'PUBLISHED').length}
                />
              }
              subtitle="Live on Skill Dev"
              icon={<CheckCircleIcon size={18} />}
              accent="emerald"
            />
            <WorkspaceKpi
              title="Primary Language"
              value="Tamil & English"
              subtitle="Accessible Delivery"
              icon={<RocketIcon size={18} />}
              accent="coral"
            />
          </div>

          {learningVideos.length === 0 ? (
            <WorkspaceEmptyState
              icon={<VideoIcon size={32} />}
              title="No masterclass videos uploaded"
              description="Upload video tutorials or recorded lectures to help students upskill."
              actionText="Upload Learning Video"
              onAction={handleOpenAddVideo}
              accent="violet"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
              {learningVideos.map((video) => (
                <WorkspaceCard
                  key={video.id || video._id}
                  variant="default"
                  padded={false}
                  className="overflow-hidden border border-[#EDE2D7] flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video w-full bg-[#3D312A] overflow-hidden">
                      <img
                        src={
                          video.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                        }
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10.5px] font-black text-white bg-black/75 rounded-md backdrop-blur-xs flex items-center gap-1">
                        <ClockIcon size={11} /> {video.duration || '15:00'}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="font-black uppercase text-[#8064A9]">{video.subject}</span>
                        <span className="text-[#82776E] font-bold">{video.viewsCount || 0} views</span>
                      </div>

                      <h4 className="text-xs font-black text-[#51463F] line-clamp-2">
                        {video.title}
                      </h4>

                      <p className="text-[11px] text-[#82776E] line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF7F2]/60 border-t border-[#EDE2D7] flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#27AE60] bg-[#27AE60]/10 px-2 py-0.5 rounded-sm">
                      {video.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <WorkspaceButton
                        variant="outline"
                        size="sm"
                        icon={<EditIcon size={12} />}
                        onClick={() => handleOpenEditVideo(video)}
                      >
                        Edit
                      </WorkspaceButton>
                      <button
                        onClick={() => (video.id || video._id) && handleDeleteVideo(video.id || video._id || '')}
                        className="p-1.5 rounded-lg border border-[#EDE2D7] text-[#C66B52] hover:bg-[#FFF4F0] cursor-pointer"
                        title="Delete Video"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                </WorkspaceCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER REGULAR MARKETPLACE VIEW (when !isMentor OR mentorTab === 'MARKETPLACE') */}
      {(!isMentor || mentorTab === 'MARKETPLACE') && (
        <div className="space-y-4">

          {/* ========================================================
          2. 4 KPI SUMMARY CARDS (Total, Active, Drafts, Needs Revision)
         ======================================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <WorkspaceKpi
              title="Total Services"
              value={<AnimatedCounter value={totalCount} />}
              subtitle="In your account"
              icon={<BriefcaseIcon size={18} />}
              accent="coral"
            />
            <WorkspaceKpi
              title="Active (Approved)"
              value={<AnimatedCounter value={approvedCount} />}
              subtitle="Live on Marketplace"
              icon={<CheckCircleIcon size={18} />}
              accent="emerald"
            />
            <WorkspaceKpi
              title="Drafts"
              value={<AnimatedCounter value={draftCount} />}
              subtitle="Not submitted yet"
              icon={<FileTextIcon size={18} />}
              accent="violet"
            />
            <WorkspaceKpi
              title="Needs Revision"
              value={<AnimatedCounter value={rejectedCount} />}
              subtitle="Check feedback"
              icon={<AlertCircleIcon size={18} />}
              accent="rose"
            />
          </div>

          {/* ========================================================
          3. STATUS FILTER TABS
         ======================================================== */}
          <WorkspaceCard variant="glass" padded={false} className="p-1 sm:p-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
              {[
                { key: 'ALL', label: 'All Services', count: totalCount },
                { key: 'APPROVED', label: 'Active & Live', count: approvedCount },
                { key: 'PENDING_APPROVAL', label: 'Under Review', count: pendingCount },
                { key: 'DRAFT', label: 'Drafts', count: draftCount },
                { key: 'REJECTED', label: 'Needs Revision', count: rejectedCount },
                { key: 'REQUESTS', label: 'Service Requests', count: incomingRequests.length }
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className="relative px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors duration-200"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="servicesActiveTabIndicator"
                        className="absolute inset-0 bg-gradient-to-r from-[#E8795B] to-[#D96B4E] rounded-lg shadow-[0_2px_8px_rgba(232,121,91,0.25)] z-0"
                        transition={motionSprings.snappy}
                      />
                    )}
                    <span
                      className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-[#453A33] hover:text-[#C65638] font-bold'
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-[#FAF7F2] text-[#51463F] border border-[#EDE2D7]'
                          }`}
                      >
                        {tab.count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </WorkspaceCard>

          {/* ========================================================
          4. SERVICES LISTINGS GRID / SERVICE REQUESTS VIEW
         ======================================================== */}
          {activeTab === 'REQUESTS' ? (
            <div className="space-y-4">
              {incomingRequests.length === 0 ? (
                <WorkspaceEmptyState
                  icon={<FileTextIcon size={28} />}
                  title="No Service Requests Received Yet"
                  description="When other FIC members request your verified capabilities from the Universal Marketplace or Admin assigns requirements to you, they will appear here with instant Accept or Decline actions."
                  accent="violet"
                />
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {incomingRequests.map((req) => (
                    <motion.div
                      key={req.id}
                      variants={staggerItem}
                      className="p-5 rounded-2xl bg-white border border-[#EDE2D7] shadow-sm hover:shadow-md transition-shadow duration-200 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#F4EFE8]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black uppercase text-[#E8795B] tracking-wider">
                              {req.serviceCategory || 'Service Assignment'}
                            </span>
                            <span className="text-[#D3C7BC]">•</span>
                            <span className="text-xs text-[#82776E] font-medium font-mono">
                              Ref: {req.id.substring(req.id.length - 8)}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-[#51463F]">
                            {req.serviceTitle || req.title}
                          </h4>
                        </div>

                        <div>
                          {req.status === 'ACCEPTED' ? (
                            <WorkspaceBadge variant="active">
                              <CheckCircleIcon size={13} />
                              Assignment Accepted
                            </WorkspaceBadge>
                          ) : req.status === 'DECLINED' ? (
                            <WorkspaceBadge variant="urgent">
                              <AlertCircleIcon size={13} />
                              Assignment Declined
                            </WorkspaceBadge>
                          ) : (
                            <WorkspaceBadge variant="pending">
                              <ClockIcon size={13} />
                              Pending Decision
                            </WorkspaceBadge>
                          )}
                        </div>
                      </div>

                      {/* Requester & Scope */}
                      <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#EDE2D7] space-y-2">
                        <div className="flex flex-wrap items-center justify-between text-xs text-[#6B5E55] gap-2">
                          <div>
                            <span className="font-bold text-[#51463F]">Client:</span>{' '}
                            <span className="text-[#82776E] italic font-semibold">Protected by FIC (Confidential)</span>
                            {req.requesterCategory && (
                              <span className="ml-1 text-[11px] text-[#82776E]">({req.requesterCategory})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#82776E]">
                            Received: {req.date}
                          </div>
                        </div>

                        <div className="text-xs text-[#51463F] leading-relaxed pt-1 border-t border-[#EDE2D7]/60">
                          <span className="font-bold block text-[11px] uppercase tracking-wider text-[#82776E] mb-0.5">
                            Project Scope & Requirements:
                          </span>
                          <p className="whitespace-pre-wrap">{req.requirementNotes || req.description || 'No detailed scope provided.'}</p>
                        </div>
                      </div>

                      {/* Action Decision Area */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="text-xs text-[#82776E] flex items-center gap-1.5">
                          <LockIcon size={13} className="text-[#8064B1]" />
                          <span>Coordinated under FIC Governance Desk</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {req.status === 'PENDING' || req.status === 'AWAITING' || (req as any).providerDecision === 'AWAITING' ? (
                            <>
                              <button
                                type="button"
                                disabled={respondingId === req.id}
                                onClick={() => {
                                  setDeclineModalReq(req);
                                  setDeclineReason('');
                                }}
                                className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Decline
                              </button>
                              <button
                                type="button"
                                disabled={respondingId === req.id}
                                onClick={() => {
                                  setAcceptModalReq(req);
                                  setAcceptMessage('');
                                }}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {respondingId === req.id ? (
                                  <ClockIcon size={13} className="animate-spin" />
                                ) : (
                                  <CheckCircleIcon size={13} />
                                )}
                                <span>Accept Request</span>
                              </button>
                            </>
                          ) : req.status === 'ACCEPTED' || (req as any).providerDecision === 'ACCEPTED' || req.providerResponse === 'ACCEPTED' ? (
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                                <CheckCircleIcon size={13} />
                                Accepted • FIC Coordinator Facilitating Introduction
                              </span>
                              {req.providerResponseMessage && (
                                <p className="text-[11px] text-[#82776E] italic">
                                  Your note: "{req.providerResponseMessage}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                                <AlertCircleIcon size={13} />
                                Declined by Provider
                              </span>
                              {req.providerRejectionReason && (
                                <p className="text-[11px] text-[#82776E] italic">
                                  Reason: "{req.providerRejectionReason}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredServices.length === 0 ? (
                <WorkspaceEmptyState
                  icon={<BriefcaseIcon size={28} />}
                  title={
                    activeTab === 'ALL'
                    ? 'You have not added any services yet'
                    : `No services found in "${activeTab}" status`
                }
                description="Add your business capabilities, manufacturing lines, software competencies, or professional advisory offerings so other members can discover them in the Universal Marketplace."
                actionText="Add Your First Service"
                onAction={handleOpenAddModal}
                accent="coral"
              />
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {filteredServices.map((service) => (
                  <motion.div
                    key={service.id}
                    layout
                    variants={staggerItem}
                    whileHover={{ y: -2, transition: motionSprings.cardHover }}
                    transition={motionSprings.gentle}
                  >
                    <div className="bg-white/95 rounded-2xl border border-[#EADFCF] p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(41,48,45,0.05)] hover:border-[#C66B52]/40 transition-all flex flex-col justify-between gap-3">
                      <div className="space-y-2">
                        {/* 1. Header: Sector & Subcategory + Status Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-black bg-[#FFF4F0] text-[#C66B52] border border-[#E58C72]/30">
                              {service.categoryName}
                            </span>
                            {service.subcategoryName && (
                              <span className="text-[11px] text-[#8064B1] font-bold">
                                • {service.subcategoryName}
                              </span>
                            )}
                          </div>

                          <div>
                            {service.status === 'APPROVED' && (
                              <WorkspaceBadge variant="active">
                                <CheckCircleIcon size={12} />
                                Live on Marketplace
                              </WorkspaceBadge>
                            )}
                            {service.status === 'PENDING_APPROVAL' && (
                              <WorkspaceBadge variant="pending">
                                <ClockIcon size={12} />
                                Under Review
                              </WorkspaceBadge>
                            )}
                            {service.status === 'DRAFT' && (
                              <WorkspaceBadge variant="neutral">
                                <FileTextIcon size={12} />
                                Draft
                              </WorkspaceBadge>
                            )}
                            {service.status === 'REJECTED' && (
                              <WorkspaceBadge variant="urgent">
                                <AlertCircleIcon size={12} />
                                Needs Revision
                              </WorkspaceBadge>
                            )}
                          </div>
                        </div>

                        {/* 2. Service Title */}
                        <h3 className="text-sm sm:text-base font-black text-[#51463F] leading-snug">
                          {service.title}
                        </h3>

                        {/* 3. Short Description (Limited to 2 lines) */}
                        <p className="text-xs text-[#82776E] line-clamp-2 leading-relaxed">
                          {service.shortDescription || (service.description?.length > 160 ? `${service.description.substring(0, 160)}...` : service.description)}
                        </p>

                        {/* 4. Created Date */}
                        <div className="text-[11px] text-[#A89F91] font-mono">
                          Created: {service.createdAt || 'Recent'}
                        </div>
                      </div>

                      {/* 5. Bottom Action Row with View Details Button */}
                      <div className="pt-3 border-t border-[#EADFCF] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <WorkspaceButton
                            variant="outline"
                            size="sm"
                            icon={<EyeIcon size={13} />}
                            onClick={() => setSelectedDetailService(service)}
                          >
                            View Details
                          </WorkspaceButton>

                          {service.status === 'APPROVED' && (
                            <Link to="/marketplace">
                              <WorkspaceButton
                                variant="ghost"
                                size="sm"
                                icon={<ArrowRightIcon size={12} />}
                              >
                                View in Marketplace
                              </WorkspaceButton>
                            </Link>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {service.status === 'DRAFT' && (
                            <WorkspaceButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleSubmitForApproval(service.id)}
                            >
                              Submit for FIC Approval
                            </WorkspaceButton>
                          )}

                          {(service.status === 'DRAFT' || service.status === 'REJECTED') && (
                            <WorkspaceButton
                              variant="outline"
                              size="sm"
                              icon={<EditIcon size={13} />}
                              onClick={() => handleOpenEditModal(service)}
                            >
                              Edit
                            </WorkspaceButton>
                          )}

                          {service.status === 'APPROVED' && (
                            <WorkspaceButton
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                setServices((prev) =>
                                  prev.map((s) => (s.id === service.id ? { ...s, status: 'DRAFT' as const } : s))
                                );
                                await updateMemberService(service.id, { status: 'DRAFT' });
                                showToast('Service unpublished and moved to Drafts.', 'info');
                                await loadUserServices();
                              }}
                            >
                              Move to Draft
                            </WorkspaceButton>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(service.id || (service as any)._id, service.title)}
                            className="p-1.5 text-[#77786E] hover:text-[#C66B52] rounded-xl hover:bg-[#FFF4F0] transition-colors cursor-pointer"
                            title="Delete Service"
                          >
                            <TrashIcon size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    )}

      {/* ========================================================
          ACCEPT SERVICE ASSIGNMENT MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!acceptModalReq}
        onClose={() => setAcceptModalReq(null)}
        title="Accept Service Assignment"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#82776E] leading-relaxed">
            Confirm your acceptance of project <strong className="text-[#51463F]">"{acceptModalReq?.serviceTitle || acceptModalReq?.title}"</strong>. FIC Intermediary Desk will be notified immediately to proceed with client coordination.
          </p>
          <div>
            <label className="block text-xs font-bold text-[#51463F] mb-1">
              Response Note / Clarification (Optional)
            </label>
            <textarea
              rows={3}
              value={acceptMessage}
              onChange={(e) => setAcceptMessage(e.target.value)}
              placeholder="e.g. Confirmed capacity available. Typical turnaround is 7-10 business days..."
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B9C91] bg-white resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAcceptModalReq(null)}
              className="px-3 py-1.5 text-xs font-bold text-[#6B5E55] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={respondingId === acceptModalReq?.id}
              onClick={() => acceptModalReq && handleAcceptRequest(acceptModalReq.id, acceptMessage)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Confirm Acceptance
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* ========================================================
          DECLINE SERVICE ASSIGNMENT MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!declineModalReq}
        onClose={() => setDeclineModalReq(null)}
        title="Decline Service Assignment"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#82776E] leading-relaxed">
            Please state why you are unable to fulfill this requirement so FIC Admin can guide the client appropriately.
          </p>
          <div>
            <label className="block text-xs font-bold text-[#51463F] mb-1">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Schedule at full capacity, volume requirement exceeds available machinery, outside delivery territory..."
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeclineModalReq(null)}
              className="px-3 py-1.5 text-xs font-bold text-[#6B5E55] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={respondingId === declineModalReq?.id || !declineReason.trim()}
              onClick={() => declineModalReq && handleDeclineRequest(declineModalReq.id, declineReason)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Confirm Decline
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* ========================================================
          5. ADD / EDIT SERVICE MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingServiceId ? 'Edit Capability Listing' : 'Add New Service / Capability'}
        maxWidth="3xl"
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#8064A9] uppercase tracking-wider">
              1. Basic Information
            </h4>

            <div>
              <label className="text-xs font-black text-[#51463F] block mb-1">
                Service Title <span className="text-[#E8795B]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bulk Cotton Garment & Uniform Manufacturing or Cloud Native Microservices"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-[#51463F] block mb-1">
                  Primary Sector <span className="text-[#E8795B]">*</span>
                </label>
                <div className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl bg-slate-50 text-[#51463F] font-bold select-none flex items-center justify-between shadow-2xs">
                  <span>{categoryName || user?.primaryCategoryName || user?.categoryName || 'Business & Entrepreneurship'}</span>
                  <span className="text-[10px] text-slate-500 font-bold px-2 py-0.5 rounded bg-slate-200/80">Locked to Profile</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-[#51463F] block mb-1">
                  Subcategory / Specialization
                </label>
                <div className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl bg-slate-50 text-[#51463F] font-bold select-none flex items-center justify-between shadow-2xs">
                  <span>{subcategoryName || user?.primarySubcategoryName || user?.subCategory || 'General Specialization'}</span>
                  <span className="text-[10px] text-slate-500 font-bold px-2 py-0.5 rounded bg-slate-200/80">Locked to Profile</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-[#51463F] block mb-1">
                Short Card Summary (1-2 sentences)
              </label>
              <input
                type="text"
                placeholder="Brief summary shown on the marketplace card preview..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F]"
              />
            </div>

            <div>
              <label className="text-xs font-black text-[#51463F] block mb-1">
                Full Description & Scope of Capability <span className="text-[#E8795B]">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe your facilities, team capabilities, quality standards, infrastructure, and commercial readiness in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F]"
                required
              ></textarea>
            </div>
          </div>

          {/* Section 2: Scope, Deliverables & Delivery */}
          <div className="space-y-3 pt-3 border-t border-[#EDE2D7]">
            <h4 className="text-xs font-black text-[#8064B1] uppercase tracking-wider">
              2. Scope, Deliverables & Delivery
            </h4>

            <div>
              <label className="text-xs font-black text-[#51463F] block mb-1">
                Key Services Offered / Deliverables (Enter one per line or comma-separated)
              </label>
              <textarea
                rows={3}
                placeholder="e.g.&#10;Institutional Uniform Stitching&#10;Corporate Workwear&#10;Quality Assurance & Packaging"
                value={servicesOfferedInput}
                onChange={(e) => setServicesOfferedInput(e.target.value)}
                className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F]"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-[#51463F] block mb-1">
                  Core Skills & Competencies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fabric Processing, OEM Stitching, Supply Chain"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#51463F] block mb-1">
                  Marketplace Tags
                </label>
                <input
                  type="text"
                  placeholder="e.g. Textiles, Export Quality, Bulk Orders"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-[#51463F] block mb-1">
                  Coverage Area
                </label>
                <select
                  value={coverageArea}
                  onChange={(e) => setCoverageArea(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F] font-semibold"
                >
                  <option value="Pan India">Pan India</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="South India">South India</option>
                  <option value="Regional / Local">Regional / Local</option>
                  <option value="Global / International">Global / International</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-[#51463F] block mb-1">
                  Delivery Mode
                </label>
                <select
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value as any)}
                  className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F] font-semibold"
                >
                  <option value="ONLINE">Online / Remote Delivery</option>
                  <option value="IN_PERSON">In-Person / On-Site / Factory</option>
                  <option value="BOTH">Both (Online & On-Site)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Supporting Details */}
          <div className="space-y-3 pt-3 border-t border-[#EDE2D7]">
            <h4 className="text-xs font-black text-[#8064B1] uppercase tracking-wider">
              3. Portfolio & Supporting Proof (Optional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-[#51463F] block mb-1">
                  Portfolio / Website Link
                </label>
                <input
                  type="text"
                  placeholder="https://yourwebsite.com or github/portfolio"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F]"
                />
              </div>

              <div>
                <label className="text-xs font-black text-[#51463F] block mb-1">
                  Certification / Supporting Doc Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. ISO 9001:2015, MSME Registered, Trade License"
                  value={supportingDocument}
                  onChange={(e) => setSupportingDocument(e.target.value)}
                  className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] bg-white text-[#51463F]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: FIC Intermediary Notice & Declaration */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE2D7] text-xs text-[#51463F] space-y-2">
            <div className="font-black text-[#E8795B] flex items-center gap-1.5">
              <ShieldCheckIcon size={16} />
              FIC Intermediary Governance Protocol:
            </div>
            <p className="text-[11px] leading-relaxed text-[#82776E]">
              Timeline and Pricing are not required upfront. When members request your service via FIC, our coordinator will validate requirements and reach out to collect your tailored commercial quote. Direct personal contact details are kept strictly confidential.
            </p>
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmGovernance}
                onChange={(e) => setConfirmGovernance(e.target.checked)}
                className="mt-0.5 rounded text-[#E8795B] focus:ring-[#E8795B]"
              />
              <span className="text-[11px] font-bold text-[#51463F]">
                I declare that this capability listing is authentic and agree to FIC Intermediary Proposal Coordination.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#EDE2D7] flex flex-wrap items-center justify-end gap-3">
            <WorkspaceButton
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </WorkspaceButton>
            <WorkspaceButton
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleSaveService(false)}
            >
              Save as Draft
            </WorkspaceButton>
            <WorkspaceButton
              variant="primary"
              size="sm"
              type="button"
              onClick={() => handleSaveService(true)}
            >
              Submit for FIC Approval
            </WorkspaceButton>
          </div>
        </div>
      </AnimatedModal>

      {/* ========================================================
          6. SIMULATED REJECTION MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={!!rejectingServiceId}
        onClose={() => setRejectingServiceId(null)}
        title="Simulate FIC Reviewer Feedback (Needs Revision)"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#82776E] leading-relaxed">
            Provide feedback explaining why this service listing requires modification before publication on the Universal Marketplace:
          </p>
          <textarea
            rows={4}
            value={rejectionFeedback}
            onChange={(e) => setRejectionFeedback(e.target.value)}
            className="w-full text-xs p-3.5 border border-[#EDE2D7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8795B] text-[#51463F]"
            placeholder="Enter reason or requested adjustments..."
          ></textarea>
          <div className="flex justify-end gap-3 pt-2">
            <WorkspaceButton variant="outline" size="sm" onClick={() => setRejectingServiceId(null)}>
              Cancel
            </WorkspaceButton>
            <WorkspaceButton
              variant="primary"
              size="sm"
              onClick={handleConfirmReject}
            >
              Confirm Rejection Feedback
            </WorkspaceButton>
          </div>
        </div>
      </AnimatedModal>

      {/* ========================================================
          7. MENTOR: ADD / EDIT TEACHING SERVICE MODAL
         ======================================================== */}
      <AnimatedModal
        isOpen={isTeachingModalOpen}
        onClose={() => setIsTeachingModalOpen(false)}
        title={editingTeachingId ? 'Edit Teaching Service' : 'Add New Teaching / Mentorship Service'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveTeaching} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Teaching Service Title <span className="text-[#E8795B]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Full-Stack System Architecture Mentorship"
              value={teachTitle}
              onChange={(e) => setTeachTitle(e.target.value)}
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-[#51463F] block mb-1">
                Subject / Specialty <span className="text-[#E8795B]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cloud Microservices, Career Roadmap"
                value={teachSubject}
                onChange={(e) => setTeachSubject(e.target.value)}
                className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F]"
                required
              />
            </div>
            <div>
              <label className="text-xs font-black text-[#51463F] block mb-1">
                Target Student Level
              </label>
              <select
                value={teachLevel}
                onChange={(e) => setTeachLevel(e.target.value as any)}
                className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F] font-semibold"
              >
                <option value="ALL_LEVELS">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-black text-[#51463F] block mb-1">
                Teaching Language
              </label>
              <input
                type="text"
                value={teachLanguage}
                onChange={(e) => setTeachLanguage(e.target.value)}
                className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F]"
              />
            </div>
            <div>
              <label className="text-xs font-black text-[#51463F] block mb-1">
                Teaching Mode
              </label>
              <select
                value={teachMode}
                onChange={(e) => setTeachMode(e.target.value as any)}
                className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F] font-semibold"
              >
                <option value="ONLINE">Online Virtual</option>
                <option value="OFFLINE">In-Person</option>
                <option value="BOTH">Both / Hybrid</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-[#51463F] block mb-1">
                Session Duration
              </label>
              <input
                type="text"
                value={teachDuration}
                onChange={(e) => setTeachDuration(e.target.value)}
                placeholder="e.g. 45 mins"
                className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Your Mentor Experience / Background
            </label>
            <input
              type="text"
              value={teachExperience}
              onChange={(e) => setTeachExperience(e.target.value)}
              placeholder="e.g. 10+ Years in Tech Architecture, Anna Univ Visiting Faculty"
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F]"
            />
          </div>

          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Availability Schedule
            </label>
            <input
              type="text"
              value={teachAvailability}
              onChange={(e) => setTeachAvailability(e.target.value)}
              placeholder="e.g. Mon-Fri (6 PM - 9 PM), Weekends"
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F]"
            />
          </div>

          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Detailed Description & Syllabus <span className="text-[#E8795B]">*</span>
            </label>
            <textarea
              rows={3}
              value={teachDescription}
              onChange={(e) => setTeachDescription(e.target.value)}
              placeholder="Explain how you work with students, project review patterns, resume tips, and learning structure..."
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F]"
              required
            />
          </div>

          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Topics Covered (comma-separated)
            </label>
            <input
              type="text"
              value={teachTopics}
              onChange={(e) => setTeachTopics(e.target.value)}
              placeholder="e.g. Scalable Microservices, Database Sharding, Mock Interviews"
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F]"
            />
          </div>

          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Key Learning Outcomes (comma-separated)
            </label>
            <input
              type="text"
              value={teachOutcomes}
              onChange={(e) => setTeachOutcomes(e.target.value)}
              placeholder="e.g. Confident System Design, Polished GitHub Portfolio"
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EDE2D7]">
            <WorkspaceButton
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsTeachingModalOpen(false)}
            >
              Cancel
            </WorkspaceButton>
            <WorkspaceButton variant="primary" size="sm" type="submit">
              {editingTeachingId ? 'Save Changes' : 'Publish Teaching Offering'}
            </WorkspaceButton>
          </div>
        </form>
      </AnimatedModal>

      {/* ========================================================
          8. MENTOR: ADD / EDIT LEARNING VIDEO MODAL (5 FIELDS ONLY)
         ======================================================== */}
      <AnimatedModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          if (!isUploading) setIsVideoModalOpen(false);
        }}
        title={editingVideoId ? 'Edit Video Masterclass' : 'Upload & Publish Video Masterclass'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveVideo} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* FIELD 1: SUBJECT / TOPIC DOMAIN */}
          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Subject / Topic Domain <span className="text-[#E8795B]">*</span>
            </label>
            <input
              type="text"
              list="mentor-subject-suggestions"
              placeholder="e.g. Java Development, Python, Web Development, Mathematics"
              value={videoSubject}
              onChange={(e) => setVideoSubject(e.target.value)}
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F] font-medium"
              required
            />
            <datalist id="mentor-subject-suggestions">
              <option value="Java Development" />
              <option value="Python Programming" />
              <option value="Web Development" />
              <option value="Cloud Architecture & AWS" />
              <option value="Digital Marketing & SEO" />
              <option value="Mathematics & Aptitude" />
              <option value="Data Structures & Algorithms" />
              <option value="AI & Machine Learning" />
              <option value="Financial Accounting & GST" />
            </datalist>
            <p className="text-[10px] text-[#82776E] mt-1">
              Select or type the subject domain students will master in this session.
            </p>
          </div>

          {/* FIELD 2: LANGUAGE */}
          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Language <span className="text-[#E8795B]">*</span>
            </label>
            <select
              value={videoLanguage}
              onChange={(e) => setVideoLanguage(e.target.value)}
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F] font-semibold"
              required
            >
              <option value="Tamil">Tamil</option>
              <option value="English">English</option>
              <option value="Tamil & English">Tamil & English (Bilingual)</option>
              <option value="Kannada">Kannada</option>
              <option value="Telugu">Telugu</option>
              <option value="Hindi">Hindi</option>
              <option value="Malayalam">Malayalam</option>
            </select>
            <p className="text-[10px] text-[#82776E] mt-1">
              Language medium used for explanation and instruction in the video.
            </p>
          </div>

          {/* FIELD 3: VIDEO UPLOAD (DRAG & DROP, SIZE/NAME, PROGRESS, REPLACE/REMOVE) */}
          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Video Upload <span className="text-[#E8795B]">*</span>
            </label>
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/avi,.mp4,.webm,.mov,.mkv,.avi"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleVideoFileChange(file);
              }}
            />

            {!videoFile && !existingVideoUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0] || null;
                  handleVideoFileChange(file);
                }}
                onClick={() => videoFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${isDragOver
                    ? 'border-[#8064A9] bg-[#8064A9]/10'
                    : 'border-[#EDE2D7] bg-[#FAF7F2] hover:bg-[#FAF7F2]/80 hover:border-[#8064A9]/50'
                  }`}
              >
                <div className="w-12 h-12 mx-auto mb-2.5 rounded-xl bg-white border border-[#EDE2D7] flex items-center justify-center text-[#8064A9] shadow-xs">
                  <VideoIcon size={24} />
                </div>
                <p className="text-xs font-black text-[#51463F]">
                  Drag & drop video file here or <span className="text-[#8064A9] underline">browse files</span>
                </p>
                <p className="text-[10.5px] text-[#82776E] mt-1">
                  Supports MP4, WebM, MOV, MKV, AVI (Max: 500 MB)
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-[#FAF7F2] border border-[#EDE2D7] rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#8064A9]/15 text-[#8064A9] flex items-center justify-center shrink-0">
                    <VideoIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#51463F] truncate">
                      {videoFile?.name || existingVideoUrl.split('/').pop() || 'Selected Masterclass Video'}
                    </p>
                    <p className="text-[10px] text-[#82776E] font-medium">
                      {videoFile ? formatFileSize(videoFile.size) : 'Ready on storage'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="text-[11px] font-bold text-[#8064A9] hover:underline px-2.5 py-1 rounded-md bg-white border border-[#EDE2D7] cursor-pointer"
                  >
                    Replace Video
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleVideoFileChange(null);
                      setExistingVideoUrl('');
                    }}
                    className="text-[11px] font-bold text-[#E8795B] hover:underline px-2.5 py-1 rounded-md bg-white border border-[#EDE2D7] cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {fileError && (
              <p className="text-[11px] text-[#C66B52] font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircleIcon size={12} /> {fileError}
              </p>
            )}

            {isUploading && (
              <div className="mt-2.5 p-3 bg-white border border-[#EDE2D7] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#51463F]">
                  <span>Uploading video to server...</span>
                  <span className="text-[#8064A9]">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#EDE2D7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8064A9] to-[#E8795B] transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* FIELD 4: DURATION – AUTOMATICALLY DETECTED */}
          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Duration <span className="text-[10.5px] font-normal text-[#82776E]">(Automatically Extracted from Video)</span>
            </label>
            <div className="p-3 bg-[#FAF7F2] border border-[#EDE2D7] rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#EDE2D7] flex items-center justify-center text-[#8064A9] shrink-0">
                  <ClockIcon size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#51463F]">
                      {isDetectingDuration ? (
                        <span className="animate-pulse text-[#82776E]">Analyzing video duration...</span>
                      ) : detectedDuration ? (
                        detectedDuration
                      ) : (
                        <span className="text-[#82776E] font-normal text-[11px]">Upload a video to detect duration</span>
                      )}
                    </span>
                    {detectedDuration && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#27AE60]/10 text-[#27AE60] border border-[#27AE60]/20 flex items-center gap-1">
                        <CheckCircleIcon size={10} /> Auto-Detected
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#82776E] mt-0.5">
                    Extracted automatically from video metadata. No manual typing required.
                  </p>
                </div>
              </div>

              {generatedThumbnail && (
                <div className="relative w-16 h-10 rounded-md overflow-hidden border border-[#EDE2D7] shrink-0 bg-black shadow-2xs">
                  <img src={generatedThumbnail} alt="Auto Frame Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center font-bold py-0.5">
                    Thumbnail
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* FIELD 5: MASTERCLASS DESCRIPTION */}
          <div>
            <label className="text-xs font-black text-[#51463F] block mb-1">
              Masterclass Description <span className="text-[#E8795B]">*</span>
            </label>
            <textarea
              rows={3}
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              placeholder="Provide a clear description of the concepts and practical hands-on skills students will learn from watching this masterclass..."
              className="w-full text-xs p-3 border border-[#EDE2D7] rounded-xl focus:outline-hidden focus:border-[#8064A9] bg-white text-[#51463F] leading-relaxed"
              required
            />
          </div>

          {/* ACTIONS: CANCEL & PUBLISH BUTTON */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EDE2D7]">
            <WorkspaceButton
              variant="outline"
              size="sm"
              type="button"
              disabled={isUploading}
              onClick={() => setIsVideoModalOpen(false)}
            >
              Cancel
            </WorkspaceButton>
            <WorkspaceButton
              variant="primary"
              size="sm"
              type="submit"
              disabled={isUploading || isDetectingDuration}
            >
              {isUploading
                ? 'Uploading Masterclass...'
                : editingVideoId
                  ? 'Save Changes'
                  : 'Publish to Skill Portal'}
            </WorkspaceButton>
          </div>
        </form>
      </AnimatedModal>
    
      {/* ========================================================
          VIEW SERVICE DETAILS MODAL (SECTION 4)
         ======================================================== */}
      <AnimatedModal
        isOpen={!!selectedDetailService}
        onClose={() => setSelectedDetailService(null)}
        title="Service Details"
        maxWidth="2xl"
      >
        {selectedDetailService && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header: Sector & Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EDE2D7]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#FFF4F0] text-[#C66B52] border border-[#E58C72]/30">
                  {selectedDetailService.categoryName}
                </span>
                {selectedDetailService.subcategoryName && (
                  <span className="text-xs text-[#8064B1] font-bold">
                    • {selectedDetailService.subcategoryName}
                  </span>
                )}
              </div>
              <div>
                {selectedDetailService.status === 'APPROVED' && (
                  <WorkspaceBadge variant="active">
                    <CheckCircleIcon size={12} /> Live on Marketplace
                  </WorkspaceBadge>
                )}
                {selectedDetailService.status === 'PENDING_APPROVAL' && (
                  <WorkspaceBadge variant="pending">
                    <ClockIcon size={12} /> Under Review
                  </WorkspaceBadge>
                )}
                {selectedDetailService.status === 'DRAFT' && (
                  <WorkspaceBadge variant="neutral">
                    <FileTextIcon size={12} /> Draft
                  </WorkspaceBadge>
                )}
                {selectedDetailService.status === 'REJECTED' && (
                  <WorkspaceBadge variant="urgent">
                    <AlertCircleIcon size={12} /> Needs Revision
                  </WorkspaceBadge>
                )}
              </div>
            </div>

            {/* Title & Dates */}
            <div>
              <h3 className="text-lg font-black text-[#51463F]">
                {selectedDetailService.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-[#82776E] mt-1 font-mono">
                <span>Created: {selectedDetailService.createdAt || 'N/A'}</span>
                {selectedDetailService.updatedAt && (
                  <>
                    <span>•</span>
                    <span>Last Updated: {selectedDetailService.updatedAt}</span>
                  </>
                )}
              </div>
            </div>

            {/* Admin Review Feedback (if available) */}
            {selectedDetailService.status === 'REJECTED' && selectedDetailService.adminFeedback && (
              <div className="p-3.5 rounded-xl bg-[#FFF0EB] border border-[#E8795B]/30 text-xs text-[#51463F] space-y-1">
                <div className="font-black text-[#E8795B] flex items-center gap-1.5">
                  <AlertCircleIcon size={14} />
                  FIC Review Feedback:
                </div>
                <p className="text-xs leading-relaxed text-[#82776E]">
                  {selectedDetailService.adminFeedback}
                </p>
              </div>
            )}

            {/* Full Service Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#8064B1]">
                Full Service Description
              </h4>
              <p className="text-xs text-[#51463F] leading-relaxed whitespace-pre-line bg-[#FAF7F2] p-3.5 rounded-xl border border-[#EDE2D7]">
                {selectedDetailService.description}
              </p>
            </div>

            {/* Business / Professional Overview */}
            {selectedDetailService.shortDescription && (
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#8064B1]">
                  Business / Professional Overview
                </h4>
                <p className="text-xs text-[#51463F] leading-relaxed bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE2D7]">
                  {selectedDetailService.shortDescription}
                </p>
              </div>
            )}

            {/* Key Deliverables / Services Offered */}
            {selectedDetailService.servicesOffered && selectedDetailService.servicesOffered.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#8064B1]">
                  Key Services Offered / Deliverables
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDetailService.servicesOffered.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2.5 rounded-xl bg-[#FAF7F2] text-[#51463F] border border-[#EDE2D7] font-semibold flex items-start gap-2"
                    >
                      <span className="text-[#E8795B] font-bold">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coverage Area & Delivery Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#82776E] block mb-1">
                  Coverage Area
                </span>
                <span className="text-xs font-bold text-[#51463F]">
                  {selectedDetailService.coverageArea || 'Pan India'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EDE2D7]">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#82776E] block mb-1">
                  Delivery Mode
                </span>
                <span className="text-xs font-bold text-[#51463F]">
                  {selectedDetailService.deliveryMode === 'ONLINE'
                    ? 'Remote / Online'
                    : selectedDetailService.deliveryMode === 'IN_PERSON'
                      ? 'On-Site / Plant'
                      : 'Online & On-Site'}
                </span>
              </div>
            </div>

            {/* Tags / Keywords */}
            {selectedDetailService.tags && selectedDetailService.tags.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#8064B1]">
                  Tags / Keywords
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDetailService.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white border border-[#EDE2D7] text-[#51463F] font-bold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer / Close Button */}
            <div className="pt-4 border-t border-[#EDE2D7] flex items-center justify-end">
              <WorkspaceButton
                variant="primary"
                size="md"
                onClick={() => setSelectedDetailService(null)}
              >
                Close
              </WorkspaceButton>
            </div>
          </div>
        )}
      </AnimatedModal>

    </WorkspaceShell>
  );
};

export default MyServicesPage;
