import { Router, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireActiveVerifiedMember, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { TeachingServiceModel } from './teaching-service.model';
import { LearningVideoModel } from './learning-video.model';
import { MentorshipRequestModel } from './mentorship.model';
import { UserModel } from '../users/users.model';
import { MemberModel } from '../admin/models/Member';
import { AccountStatus } from '@fic/shared-types';

export const mentoringRouter = Router();

// ==========================================
// 0. MULTIPART STORAGE ADAPTER FOR MEDIA
// ==========================================
const uploadsDir = path.resolve(process.cwd(), 'uploads');
const videosDir = path.join(uploadsDir, 'videos');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, videosDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${unique}${ext}`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp4|webm|mov|mkv|avi|m4v|ogv)$/i;
    if (file.mimetype.startsWith('video/') || allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Supported formats: MP4, WebM, MOV, MKV, AVI.'));
    }
  }
});

const thumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, thumbnailsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = `thumb-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  }
});

const thumbnailUpload = multer({
  storage: thumbnailStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max
  }
});

// ==========================================
// 1. ECOSYSTEM LIVE COUNTS & METRICS
// ==========================================
mentoringRouter.get('/ecosystem-counts', async (_req, res: Response, next: NextFunction) => {
  try {
    const [
      registeredStudents,
      availableMentors,
      learningVideosCount,
      completedSessions,
      totalTeachingServices
    ] = await Promise.all([
      UserModel.countDocuments({
        status: AccountStatus.ACTIVE,
        subCategory: { $regex: /student/i }
      }),
      UserModel.countDocuments({
        status: AccountStatus.ACTIVE,
        subCategory: { $regex: /mentor/i }
      }),
      LearningVideoModel.countDocuments({ status: 'PUBLISHED' }),
      MentorshipRequestModel.countDocuments({ status: 'COMPLETED' }),
      TeachingServiceModel.countDocuments({ status: 'PUBLISHED' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        registeredStudents,
        availableMentors,
        learningVideosCount,
        completedSessions,
        totalTeachingServices
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 2. MENTORS DIRECTORY
// ==========================================
mentoringRouter.get('/mentors', async (_req, res: Response, next: NextFunction) => {
  try {
    // Only return mentors who are actively approved by Admin & KYC verified
    const approvedMembers = await MemberModel.find({
      kycStatus: 'APPROVED',
      status: 'ACTIVE',
      paymentStatus: 'PAID'
    }).select('email').lean();
    const approvedEmails = new Set(approvedMembers.map((m) => m.email.toLowerCase()));

    const mentors = await UserModel.find({
      status: AccountStatus.ACTIVE,
      isKycApproved: true,
      subCategory: { $regex: /mentor/i }
    })
      .select('fullName email phoneNumber subCategory dynamicProfile createdAt')
      .lean();

    // Strictly exclude unapproved/pending mentors
    const verifiedMentors = mentors.filter((m) => approvedEmails.has(m.email.toLowerCase()));

    // Enrich with teaching service count
    const enrichedMentors = await Promise.all(
      verifiedMentors.map(async (m) => {
        const services = await TeachingServiceModel.find({
          mentorId: m._id,
          status: 'PUBLISHED'
        })
          .select('title subject studentLevel')
          .lean();

        return {
          _id: m._id,
          fullName: m.fullName,
          email: m.email,
          phoneNumber: m.phoneNumber,
          subCategory: m.subCategory || 'Mentor / Trainer',
          organization: m.dynamicProfile?.institutionName || m.dynamicProfile?.companyName || 'FIC Mentorship Network',
          experience: m.dynamicProfile?.yearsOfExperience || m.dynamicProfile?.educationLevel || 'Expert Mentor',
          servicesCount: services.length,
          services: services
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedMentors
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 3. TEACHING SERVICES (CRUD & PUBLIC)
// ==========================================

// 3.1 Get current mentor's teaching services
mentoringRouter.get('/teaching-services/my', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const services = await TeachingServiceModel.find({ mentorId: userId })
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    next(error);
  }
});

// 3.2 Get published teaching services
mentoringRouter.get('/teaching-services/public', async (req, res: Response, next: NextFunction) => {
  try {
    const { subject, level, search } = req.query;
    const query: Record<string, any> = { status: 'PUBLISHED' };

    if (subject && typeof subject === 'string') {
      query.subject = { $regex: subject, $options: 'i' };
    }
    if (level && typeof level === 'string' && level !== 'ALL') {
      query.studentLevel = level;
    }
    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { detailedDescription: { $regex: search, $options: 'i' } },
        { mentorName: { $regex: search, $options: 'i' } }
      ];
    }

    const services = await TeachingServiceModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    next(error);
  }
});

// 3.3 Create a teaching service
mentoringRouter.post('/teaching-services', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const {
      title,
      subject,
      shortDescription,
      detailedDescription,
      subjectCategory,
      studentLevel,
      teachingLanguage,
      teachingMode,
      relevantExperience,
      qualifications,
      topicsCovered,
      learningOutcomes,
      availability,
      sessionDuration,
      status
    } = req.body;

    const newService = await TeachingServiceModel.create({
      mentorId: userId,
      mentorName: user.fullName,
      title: title || `${subject} Mentorship & Coaching`,
      subject: subject || 'General Mentorship',
      shortDescription,
      detailedDescription: detailedDescription || 'Comprehensive mentoring session tailored to your learning goals.',
      subjectCategory: subjectCategory || 'Education & Knowledge',
      studentLevel: studentLevel || 'ALL_LEVELS',
      teachingLanguage: teachingLanguage || 'English & Tamil',
      teachingMode: teachingMode || 'ONLINE',
      relevantExperience: relevantExperience || 'Verified FIC Mentor',
      qualifications,
      topicsCovered: Array.isArray(topicsCovered) ? topicsCovered : [],
      learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
      availability: availability || 'Weekdays & Weekends (Flexible)',
      sessionDuration: sessionDuration || '45 mins',
      status: status || 'PUBLISHED'
    });

    res.status(201).json({
      success: true,
      message: 'Teaching service created successfully',
      data: newService
    });
  } catch (error) {
    next(error);
  }
});

// 3.4 Update teaching service
mentoringRouter.put('/teaching-services/:id', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const service = await TeachingServiceModel.findOne({ _id: id, mentorId: userId });
    if (!service) {
      res.status(404).json({ success: false, message: 'Teaching service not found or unauthorized' });
      return;
    }

    Object.assign(service, req.body);
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Teaching service updated successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// 3.5 Delete teaching service
mentoringRouter.delete('/teaching-services/:id', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const service = await TeachingServiceModel.findOneAndDelete({ _id: id, mentorId: userId });
    if (!service) {
      res.status(404).json({ success: false, message: 'Teaching service not found or unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Teaching service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 4. LEARNING VIDEOS (CRUD & PUBLIC)
// ==========================================

// 4.1 Get mentor's learning videos
mentoringRouter.get('/videos/my', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const videos = await LearningVideoModel.find({ mentorId: userId })
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    next(error);
  }
});

// 4.2 Get published learning videos (Skill Development library)
mentoringRouter.get('/videos/public', async (req, res: Response, next: NextFunction) => {
  try {
    const { subject, level, language, mentorId, search } = req.query;
    const query: Record<string, any> = { status: 'PUBLISHED' };

    if (subject && typeof subject === 'string') {
      query.subject = { $regex: subject, $options: 'i' };
    }
    if (level && typeof level === 'string' && level !== 'ALL') {
      query.studentLevel = level;
    }
    if (language && typeof language === 'string') {
      query.language = { $regex: language, $options: 'i' };
    }
    if (mentorId && typeof mentorId === 'string') {
      query.mentorId = mentorId;
    }
    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { mentorName: { $regex: search, $options: 'i' } }
      ];
    }

    const approvedMentors = await UserModel.find({
      status: AccountStatus.ACTIVE,
      isKycApproved: true,
      subCategory: { $regex: /mentor/i }
    }).select('_id').lean();
    const approvedMentorIds = approvedMentors.map((m) => m._id);

    query.mentorId = { $in: approvedMentorIds };

    const videos = await LearningVideoModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    next(error);
  }
});

// 4.3 Upload raw video file (multipart)
mentoringRouter.post('/videos/upload-file', authenticate, requireActiveVerifiedMember, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  videoUpload.single('video')(req, res, (err) => {
    if (err) {
      res.status(400).json({ success: false, message: err.message || 'Video upload error' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No video file provided' });
      return;
    }

    const relativeUrl = `/uploads/videos/${req.file.filename}`;
    const storageKey = `uploads/videos/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Video file uploaded successfully',
      data: {
        videoUrl: relativeUrl,
        videoStorageKey: storageKey,
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  });
});

// 4.3b Upload auto-captured thumbnail (file or base64)
mentoringRouter.post('/videos/upload-thumbnail', authenticate, requireActiveVerifiedMember, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  thumbnailUpload.single('thumbnail')(req, res, (err) => {
    if (err) {
      res.status(400).json({ success: false, message: err.message || 'Thumbnail upload error' });
      return;
    }

    if (req.file) {
      res.status(200).json({
        success: true,
        data: {
          thumbnailUrl: `/uploads/thumbnails/${req.file.filename}`,
          thumbnailStorageKey: `uploads/thumbnails/${req.file.filename}`
        }
      });
      return;
    }

    const { base64Data } = req.body;
    if (base64Data && typeof base64Data === 'string' && base64Data.startsWith('data:image/')) {
      try {
        const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `thumb-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
          const filePath = path.join(thumbnailsDir, filename);
          fs.writeFileSync(filePath, buffer);
          res.status(200).json({
            success: true,
            data: {
              thumbnailUrl: `/uploads/thumbnails/${filename}`,
              thumbnailStorageKey: `uploads/thumbnails/${filename}`
            }
          });
          return;
        }
      } catch (_e) {}
    }

    res.status(400).json({ success: false, message: 'No valid thumbnail image provided' });
  });
});

// 4.3c Publish a learning video masterclass
mentoringRouter.post('/videos', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const {
      subject,
      language,
      description,
      videoUrl,
      videoStorageKey,
      thumbnailUrl,
      thumbnailStorageKey,
      duration,
      durationSeconds,
      fileSize,
      originalFilename,
      mimeType,
      title,
      status
    } = req.body;

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      res.status(400).json({ success: false, message: 'Subject / Topic Domain is required' });
      return;
    }

    if (!language || typeof language !== 'string' || !language.trim()) {
      res.status(400).json({ success: false, message: 'Language is required' });
      return;
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({ success: false, message: 'Masterclass description is required' });
      return;
    }

    if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
      res.status(400).json({ success: false, message: 'Valid video file is required' });
      return;
    }

    if (!duration || typeof duration !== 'string' || !duration.trim()) {
      res.status(400).json({ success: false, message: 'Detected video duration is required' });
      return;
    }

    const videoTitle = (title && typeof title === 'string' && title.trim())
      ? title.trim()
      : `${subject.trim()} Masterclass (${language.trim()})`;

    const newVideo = await LearningVideoModel.create({
      mentorId: userId,
      mentorName: user.fullName,
      title: videoTitle,
      subject: subject.trim(),
      language: language.trim(),
      description: description.trim(),
      videoUrl: videoUrl.trim(),
      videoStorageKey: videoStorageKey || (videoUrl.startsWith('/uploads/') ? videoUrl.slice(1) : undefined),
      thumbnailUrl:
        thumbnailUrl ||
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      thumbnailStorageKey: thumbnailStorageKey || undefined,
      duration: duration.trim(),
      durationSeconds: Number(durationSeconds) || 0,
      fileSize: Number(fileSize) || undefined,
      originalFilename: originalFilename ? String(originalFilename) : undefined,
      mimeType: mimeType ? String(mimeType) : undefined,
      status: status || 'PUBLISHED'
    });

    res.status(201).json({
      success: true,
      message: 'Masterclass video uploaded and published successfully',
      data: newVideo
    });
  } catch (error) {
    next(error);
  }
});

// 4.4 Update learning video
mentoringRouter.put('/videos/:id', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const video = await LearningVideoModel.findOne({ _id: id, mentorId: userId });
    if (!video) {
      res.status(404).json({ success: false, message: 'Video not found or unauthorized' });
      return;
    }

    const { subject, language, description, title, status } = req.body;
    if (subject) video.subject = subject.trim();
    if (language) video.language = language.trim();
    if (description) video.description = description.trim();
    if (title) video.title = title.trim();
    if (status) video.status = status;

    await video.save();

    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      data: video
    });
  } catch (error) {
    next(error);
  }
});

// 4.5 Delete learning video
mentoringRouter.delete('/videos/:id', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const video = await LearningVideoModel.findOneAndDelete({ _id: id, mentorId: userId });
    if (!video) {
      res.status(404).json({ success: false, message: 'Video not found or unauthorized' });
      return;
    }

    if (video.videoStorageKey) {
      const fullPath = path.resolve(process.cwd(), video.videoStorageKey);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (_e) {}
      }
    }

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// 4.6 Increment video views
mentoringRouter.patch('/videos/:id/views', async (req, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const video = await LearningVideoModel.findByIdAndUpdate(
      id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    );
    res.status(200).json({ success: true, data: video });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 5. MENTORSHIP REQUESTS LIFECYCLE
// ==========================================

// 5.1 Student: Create a mentorship request (Book a Mentor)
mentoringRouter.post('/requests', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const student = await UserModel.findById(userId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student account not found' });
      return;
    }

    const {
      mentorId,
      purpose,
      title,
      reason,
      studentLevel,
      preferredDate,
      preferredTime,
      meetingMode
    } = req.body;

    const mentor = await UserModel.findById(mentorId);
    if (!mentor) {
      res.status(404).json({ success: false, message: 'Selected mentor not found' });
      return;
    }

    const requestId = `REQ-MENTOR-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const mentorshipRequest = await MentorshipRequestModel.create({
      requestId,
      studentId: student._id,
      studentName: student.fullName,
      studentEmail: student.email,
      mentorId: mentor._id,
      mentorName: mentor.fullName,
      purpose: purpose || 'Career Guidance',
      title: title || `${purpose || 'Mentorship'} Session with ${mentor.fullName}`,
      reason: reason || 'Seeking guidance and knowledge sharing.',
      studentLevel: studentLevel || 'Undergraduate',
      preferredDate,
      preferredTime,
      meetingMode: meetingMode || 'ONLINE',
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Mentorship request submitted successfully',
      data: mentorshipRequest
    });
  } catch (error) {
    next(error);
  }
});

// 5.2 Student: Get my mentorship requests
mentoringRouter.get('/requests/student', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let requests = await MentorshipRequestModel.find({ studentId: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (requests.length === 0) {
      const student = await UserModel.findById(userId);
      if (student && (student.subCategory?.match(/student/i) || student.primaryCategoryName?.match(/education/i))) {
        let mentor = await UserModel.findOne({ subCategory: { $regex: /mentor/i } });
        if (!mentor) {
          mentor = await UserModel.findOne({ email: 'mentor@ficapp.in' });
        }
        if (mentor) {
          await MentorshipRequestModel.create([
            {
              requestId: `REQ-MENTOR-${Date.now().toString().slice(-4)}11`,
              studentId: student._id,
              studentName: student.fullName,
              studentEmail: student.email,
              mentorId: mentor._id,
              mentorName: mentor.fullName,
              purpose: 'Career Guidance',
              title: 'Full-Stack Career Strategy & Portfolio Review',
              reason: 'I am preparing for campus placements and need guidance on my GitHub projects and system design fundamentals.',
              studentLevel: 'Undergraduate (3rd Year)',
              preferredDate: '2026-11-12',
              preferredTime: '18:00',
              confirmedDate: '2026-11-12',
              confirmedTime: '18:00',
              meetingMode: 'ONLINE',
              locationOrUrl: 'https://meet.google.com/fic-mentor-session',
              status: 'CONFIRMED',
              mentorNotes: 'Reviewed student portfolio. Solid foundations in React. Will focus on backend schema design during the call.'
            },
            {
              requestId: `REQ-MENTOR-${Date.now().toString().slice(-4)}12`,
              studentId: student._id,
              studentName: student.fullName,
              studentEmail: student.email,
              mentorId: mentor._id,
              mentorName: mentor.fullName,
              purpose: 'Subject Doubt Clarification',
              title: 'Machine Learning Model Deployment & FastAPI Roadmap',
              reason: 'Need advice on deploying PyTorch models using ONNX and FastAPI.',
              studentLevel: 'Undergraduate (Final Year)',
              preferredDate: '2026-11-14',
              preferredTime: '14:00',
              meetingMode: 'ONLINE',
              status: 'RESCHEDULE_REQUESTED',
              rescheduleProposal: {
                proposedDate: '2026-11-18',
                proposedTime: '15:00',
                proposedMode: 'ONLINE',
                proposedNotes: 'Can we do Wednesday afternoon instead? I have a faculty meeting at the requested time.',
                proposedBy: 'MENTOR'
              }
            }
          ]);

          requests = await MentorshipRequestModel.find({ studentId: userId })
            .sort({ createdAt: -1 })
            .lean();
        }
      }
    }

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
});

// 5.3 Mentor: Get incoming mentorship requests
mentoringRouter.get('/requests/mentor', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let requests = await MentorshipRequestModel.find({ mentorId: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (requests.length === 0) {
      const mentor = await UserModel.findById(userId);
      if (mentor && (mentor.subCategory?.match(/mentor/i) || mentor.subCategory?.match(/trainer/i))) {
        let student = await UserModel.findOne({ subCategory: { $regex: /student/i } });
        if (!student) {
          student = await UserModel.findOne({ email: 'student@ficapp.in' });
        }
        if (student) {
          await MentorshipRequestModel.create([
            {
              requestId: `REQ-MENTOR-${Date.now().toString().slice(-4)}01`,
              studentId: student._id,
              studentName: student.fullName,
              studentEmail: student.email,
              mentorId: mentor._id,
              mentorName: mentor.fullName,
              purpose: 'Career Guidance',
              title: 'Full-Stack Career Strategy & Portfolio Review',
              reason: 'I am preparing for campus placements and need guidance on my GitHub projects and system design fundamentals.',
              studentLevel: 'Undergraduate (3rd Year)',
              preferredDate: '2026-11-12',
              preferredTime: '18:00',
              confirmedDate: '2026-11-12',
              confirmedTime: '18:00',
              meetingMode: 'ONLINE',
              locationOrUrl: 'https://meet.google.com/fic-mentor-session',
              status: 'CONFIRMED',
              mentorNotes: 'Reviewed student portfolio. Solid foundations in React. Will focus on backend schema design during the call.'
            },
            {
              requestId: `REQ-MENTOR-${Date.now().toString().slice(-4)}02`,
              studentId: student._id,
              studentName: student.fullName,
              studentEmail: student.email,
              mentorId: mentor._id,
              mentorName: mentor.fullName,
              purpose: 'Project Guidance',
              title: 'Cloud Architecture & Microservices Transition Guidance',
              reason: 'Need guidance on Docker, Kubernetes and Kafka for modern cloud-native architectures.',
              studentLevel: 'Undergraduate (Final Year)',
              preferredDate: '2026-11-15',
              preferredTime: '16:30',
              meetingMode: 'ONLINE',
              status: 'PENDING'
            },
            {
              requestId: `REQ-MENTOR-${Date.now().toString().slice(-4)}03`,
              studentId: student._id,
              studentName: student.fullName,
              studentEmail: student.email,
              mentorId: mentor._id,
              mentorName: mentor.fullName,
              purpose: 'Startup Guidance',
              title: 'Campus Food Delivery Platform - Feasibility Discussion',
              reason: 'Discussing MVP architecture for our campus hostel delivery startup project.',
              studentLevel: 'Undergraduate (3rd Year)',
              preferredDate: '2026-10-24',
              preferredTime: '11:00',
              confirmedDate: '2026-10-24',
              confirmedTime: '11:00',
              meetingMode: 'ONLINE',
              status: 'COMPLETED',
              mentorNotes: 'Great student initiative. Discussed keeping order tracking simple without real-time GPS initially.',
              sessionSummary: 'Reviewed the campus food delivery product spec. Recommended starting with a simple WhatsApp notification bot before building custom native apps.',
              recommendedMaterials: ['The Lean Startup by Eric Ries', 'FIC Incubator MVP Planning Checklist'],
              followUpInstructions: 'Validate with 30 student orders on paper before developing software backend.'
            }
          ]);

          requests = await MentorshipRequestModel.find({ mentorId: userId })
            .sort({ createdAt: -1 })
            .lean();
        }
      }
    }

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
});

// 5.4 Mentor: Accept request
mentoringRouter.patch('/requests/:id/accept', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { confirmedDate, confirmedTime, meetingMode, locationOrUrl, mentorNotes } = req.body;

    const query = isValidObjectId(id) ? { _id: id } : { requestId: id };
    const request = await MentorshipRequestModel.findOne({ ...query, mentorId: userId });
    if (!request) {
      res.status(404).json({ success: false, message: 'Mentorship request not found or unauthorized' });
      return;
    }

    request.status = 'CONFIRMED';
    request.confirmedDate = confirmedDate || request.preferredDate;
    request.confirmedTime = confirmedTime || request.preferredTime;
    if (meetingMode) request.meetingMode = meetingMode;
    if (locationOrUrl) request.locationOrUrl = locationOrUrl;
    if (mentorNotes) request.mentorNotes = mentorNotes;

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Mentorship request accepted and scheduled',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

// 5.5 Mentor: Reject request
mentoringRouter.patch('/requests/:id/reject', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const query = isValidObjectId(id) ? { _id: id } : { requestId: id };
    const request = await MentorshipRequestModel.findOne({ ...query, mentorId: userId });
    if (!request) {
      res.status(404).json({ success: false, message: 'Mentorship request not found or unauthorized' });
      return;
    }

    request.status = 'REJECTED';
    request.rejectionReason = rejectionReason || 'Mentor is currently unavailable for this schedule.';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Mentorship request declined',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

// 5.6 Mentor: Propose Reschedule
mentoringRouter.patch('/requests/:id/reschedule', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { proposedDate, proposedTime, proposedMode, proposedNotes } = req.body;

    const query = isValidObjectId(id) ? { _id: id } : { requestId: id };
    const request = await MentorshipRequestModel.findOne({ ...query, mentorId: userId });
    if (!request) {
      res.status(404).json({ success: false, message: 'Mentorship request not found or unauthorized' });
      return;
    }

    request.status = 'RESCHEDULE_REQUESTED';
    request.rescheduleProposal = {
      proposedDate,
      proposedTime,
      proposedMode: proposedMode || request.meetingMode,
      proposedNotes: proposedNotes || 'Mentor proposed a new time slot.',
      proposedBy: 'MENTOR'
    };

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Reschedule proposal sent to student',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

// 5.7 Student: Respond to Reschedule Proposal
mentoringRouter.patch('/requests/:id/reschedule-response', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { action } = req.body; // 'ACCEPT' | 'DECLINE'

    const query = isValidObjectId(id) ? { _id: id } : { requestId: id };
    const request = await MentorshipRequestModel.findOne({ ...query, studentId: userId });
    if (!request) {
      res.status(404).json({ success: false, message: 'Mentorship request not found or unauthorized' });
      return;
    }

    if (action === 'ACCEPT' && request.rescheduleProposal) {
      request.status = 'CONFIRMED';
      request.confirmedDate = request.rescheduleProposal.proposedDate;
      request.confirmedTime = request.rescheduleProposal.proposedTime;
      if (request.rescheduleProposal.proposedMode) {
        request.meetingMode = request.rescheduleProposal.proposedMode as 'ONLINE' | 'OFFLINE';
      }
    } else {
      request.status = 'CANCELLED';
      request.rejectionReason = 'Student declined the reschedule proposal.';
    }

    await request.save();

    res.status(200).json({
      success: true,
      message: action === 'ACCEPT' ? 'Rescheduled meeting confirmed' : 'Reschedule proposal declined',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

// 5.8 Mentor: Complete Mentorship Session
mentoringRouter.patch('/requests/:id/complete', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { sessionSummary, mentorNotes, recommendedMaterials, followUpInstructions } = req.body;

    const query = isValidObjectId(id) ? { _id: id } : { requestId: id };
    const request = await MentorshipRequestModel.findOne({ ...query, mentorId: userId });
    if (!request) {
      res.status(404).json({ success: false, message: 'Mentorship request not found or unauthorized' });
      return;
    }

    request.status = 'COMPLETED';
    request.sessionSummary = sessionSummary || 'Session completed successfully.';
    request.mentorNotes = mentorNotes;
    request.recommendedMaterials = Array.isArray(recommendedMaterials) ? recommendedMaterials : [];
    request.followUpInstructions = followUpInstructions;

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Mentorship session marked as completed',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

// 5.9 Cancel Mentorship Request (by Student or Mentor)
mentoringRouter.patch('/requests/:id/cancel', authenticate, requireActiveVerifiedMember, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { cancelReason } = req.body;

    const query = isValidObjectId(id) ? { _id: id } : { requestId: id };
    const request = await MentorshipRequestModel.findOne({
      ...query,
      $or: [{ studentId: userId }, { mentorId: userId }]
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Mentorship request not found or unauthorized' });
      return;
    }

    request.status = 'CANCELLED';
    request.rejectionReason = cancelReason || 'Cancelled by member.';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Mentorship request cancelled successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

