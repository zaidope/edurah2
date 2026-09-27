// ============================================================================
// src/lib/institutional.ts: INSTITUTIONAL LAYER SERVICE
// Sections & Cohorts, Attendance Roll-Call with 48h Immutability,
// Guardian Portal & Dossier, Live Classes Join Windows & Prerequisite Engine
// ============================================================================

import {
  Section,
  Enrollment,
  AttendanceRecord,
  StudentAttendanceSummary,
  GuardianLink,
  GuardianStudentDossier,
  LiveSession,
} from '@/types';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { AuditService } from '@/lib/audit';
import { ContentService } from '@/lib/content';
import { GradebookService } from '@/lib/gradebook';
import { AssignmentsRepository } from '@/lib/assignments';

declare global {
  // eslint-disable-next-line no-var
  var __edurah_sections: Section[] | undefined;
  // eslint-disable-next-line no-var
  var __edurah_enrollments: Enrollment[] | undefined;
  // eslint-disable-next-line no-var
  var __edurah_attendance: AttendanceRecord[] | undefined;
  // eslint-disable-next-line no-var
  var __edurah_guardian_links: GuardianLink[] | undefined;
  // eslint-disable-next-line no-var
  var __edurah_live_sessions: LiveSession[] | undefined;
}

const sectionsStore: Section[] = globalThis.__edurah_sections || [
  {
    id: 'sec-g6-a',
    gradeId: 'grade-6',
    name: 'Section 6-A (Alpha Cohort)',
    classTeacherId: 'teacher-g6-lead',
    classTeacherName: 'Dr. Oliver Vance',
    studentCount: 24,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'sec-g6-b',
    gradeId: 'grade-6',
    name: 'Section 6-B (Beta Cohort)',
    classTeacherId: 'teacher-g6-assistant',
    classTeacherName: 'Prof. Clara Bloom',
    studentCount: 22,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'sec-g1-a',
    gradeId: 'grade-1',
    name: 'Section 1-A (Foundations)',
    classTeacherId: 'teacher-g1-lead',
    classTeacherName: 'Ms. Clara Bloom',
    studentCount: 18,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const enrollmentsStore: Enrollment[] = globalThis.__edurah_enrollments || [];
const attendanceStore: AttendanceRecord[] = globalThis.__edurah_attendance || [];
const guardianLinksStore: GuardianLink[] = globalThis.__edurah_guardian_links || [];
const liveSessionsStore: LiveSession[] = globalThis.__edurah_live_sessions || [
  {
    id: 'live-default-1',
    courseId: 'course-g6-sci',
    courseTitle: 'Grade 6 Science: Earth Systems & Astronomy',
    sectionId: 'sec-g6-a',
    title: 'Interactive Tectonics Laboratory & Live Modeling',
    provider: 'google_meet',
    meetingUrl: 'https://meet.google.com/edu-scie-g6a',
    scheduledStart: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Starts in 30 mins
    scheduledEnd: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    hostTeacherId: 'system-teacher',
    hostTeacherName: 'Dr. Oliver Vance',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  },
];

if (process.env.NODE_ENV !== 'production') {
  globalThis.__edurah_sections = sectionsStore;
  globalThis.__edurah_enrollments = enrollmentsStore;
  globalThis.__edurah_attendance = attendanceStore;
  globalThis.__edurah_guardian_links = guardianLinksStore;
  globalThis.__edurah_live_sessions = liveSessionsStore;
}

export const InstitutionalService = {
  // ==========================================================================
  // 1. SECTIONS & COHORTS
  // ==========================================================================
  getSections(gradeId?: string): Section[] {
    if (gradeId) {
      return sectionsStore.filter((s) => s.gradeId === gradeId);
    }
    return sectionsStore;
  },

  getSectionById(id: string): Section | undefined {
    return sectionsStore.find((s) => s.id === id);
  },

  createSection(
    data: { gradeId: string; name: string; classTeacherId?: string; classTeacherName?: string },
    actor: { id: string; role?: string }
  ): Section {
    if (actor.role !== 'admin' && actor.role !== 'teacher') {
      throw new Error('Faculty or administrator privileges required to create sections.');
    }

    const exists = sectionsStore.some(
      (s) => s.gradeId === data.gradeId && s.name.toLowerCase() === data.name.trim().toLowerCase()
    );
    if (exists) {
      throw new Error(`Section with name "${data.name}" already exists for this grade.`);
    }

    const section: Section = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      gradeId: data.gradeId,
      name: data.name.trim(),
      classTeacherId: data.classTeacherId,
      classTeacherName: data.classTeacherName,
      studentCount: 0,
      createdAt: new Date().toISOString(),
    };

    sectionsStore.push(section);

    AuditService.recordLog({
      actorId: actor.id,
      action: 'section_created',
      entityType: 'section',
      entityId: section.id,
      after: { ...section },
    });

    return section;
  },

  enrollStudent(
    data: { studentId: string; courseId: string; sectionId?: string },
    actor: { id: string; role?: string }
  ): Enrollment {
    if (actor.role !== 'admin' && actor.role !== 'teacher') {
      throw new Error('Privileges required to manage enrollments.');
    }

    const section = data.sectionId ? this.getSectionById(data.sectionId) : undefined;
    let enrollment = enrollmentsStore.find(
      (e) => e.studentId === data.studentId && e.courseId === data.courseId
    );

    const before = enrollment ? { ...enrollment } : null;

    if (enrollment) {
      enrollment.sectionId = data.sectionId;
      enrollment.sectionName = section?.name;
      enrollment.status = 'active';
    } else {
      enrollment = {
        id: `enr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentId: data.studentId,
        courseId: data.courseId,
        sectionId: data.sectionId,
        sectionName: section?.name,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      enrollmentsStore.push(enrollment);
    }

    AuditService.recordLog({
      actorId: actor.id,
      action: before ? 'enrollment_updated' : 'enrollment_created',
      entityType: 'enrollment',
      entityId: enrollment.id,
      before,
      after: { ...enrollment },
    });

    return enrollment;
  },

  getStudentEnrollment(studentId: string, courseId: string): Enrollment | undefined {
    return enrollmentsStore.find((e) => e.studentId === studentId && e.courseId === courseId);
  },

  getSectionRoster(sectionId: string): {
    section: Section;
    students: {
      id: string;
      fullName: string;
      email: string;
      attendancePercentage: number;
      enrollmentStatus: string;
    }[];
  } {
    const section = this.getSectionById(sectionId);
    if (!section) throw new Error('Section not found');

    const enrollments = enrollmentsStore.filter((e) => e.sectionId === sectionId);
    const students = enrollments.map((enr) => {
      const summary = this.getStudentAttendanceSummary(enr.studentId);
      return {
        id: enr.studentId,
        fullName: enr.studentName || 'Enrolled Student',
        email: enr.studentEmail || 'student@edurah.test',
        attendancePercentage: summary.attendancePercentage,
        enrollmentStatus: enr.status,
      };
    });

    return { section, students };
  },

  // ==========================================================================
  // 2. ATTENDANCE & 48-HOUR IMMUTABILITY
  // ==========================================================================
  getAttendanceForSection(sectionId: string, date: string): AttendanceRecord[] {
    return attendanceStore.filter((a) => a.sectionId === sectionId && a.date === date);
  },

  getStudentAttendanceSummary(studentId: string): StudentAttendanceSummary {
    const records = attendanceStore
      .filter((a) => a.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalDays = records.length;
    let presentCount = 0;
    let absentCount = 0;
    let tardyCount = 0;
    let excusedCount = 0;

    for (const r of records) {
      if (r.status === 'present') presentCount++;
      else if (r.status === 'absent') absentCount++;
      else if (r.status === 'tardy') tardyCount++;
      else if (r.status === 'excused') excusedCount++;
    }

    const effectivePresent = presentCount + excusedCount + tardyCount * 0.8;
    const attendancePercentage =
      totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 100;

    return {
      studentId,
      totalDays,
      presentCount,
      absentCount,
      tardyCount,
      excusedCount,
      attendancePercentage,
      records,
    };
  },

  recordRollCall(
    data: {
      sectionId: string;
      date: string; // YYYY-MM-DD
      records: { studentId: string; status: 'present' | 'absent' | 'tardy' | 'excused' }[];
    },
    actor: { id: string; role?: string },
    justification?: string
  ): { savedCount: number; records: AttendanceRecord[] } {
    if (actor.role !== 'admin' && actor.role !== 'teacher') {
      throw new Error('Faculty privileges required to record roll call.');
    }

    // 48-HOUR IMMUTABILITY ENFORCEMENT
    const recordDate = new Date(`${data.date}T23:59:59`);
    const now = new Date();
    const diffMs = now.getTime() - recordDate.getTime();
    const isPast48Hours = diffMs > 48 * 60 * 60 * 1000;

    if (isPast48Hours && actor.role !== 'admin') {
      const error: any = new Error(
        'ATTENDANCE_LOCKED: Attendance records older than 48 hours are locked by institutional policy. Administrator amendment required.'
      );
      error.code = 'ATTENDANCE_LOCKED';
      throw error;
    }

    if (isPast48Hours && actor.role === 'admin' && !justification?.trim()) {
      const error: any = new Error(
        'JUSTIFICATION_REQUIRED: Administrator justification comment required when modifying attendance past 48 hours.'
      );
      error.code = 'JUSTIFICATION_REQUIRED';
      throw error;
    }

    const savedRecords: AttendanceRecord[] = [];
    const nowIso = new Date().toISOString();

    for (const item of data.records) {
      let existing = attendanceStore.find(
        (a) => a.sectionId === data.sectionId && a.studentId === item.studentId && a.date === data.date
      );

      const before = existing ? { ...existing } : null;

      if (existing) {
        existing.status = item.status;
        existing.markedBy = actor.id;
        existing.markedAt = nowIso;
        savedRecords.push(existing);
      } else {
        existing = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sectionId: data.sectionId,
          studentId: item.studentId,
          date: data.date,
          status: item.status,
          markedBy: actor.id,
          markedAt: nowIso,
        };
        attendanceStore.push(existing);
        savedRecords.push(existing);
      }

      // If modifying past 48 hours, record individual audit log
      if (isPast48Hours) {
        AuditService.recordLog({
          actorId: actor.id,
          action: 'attendance_past_48h_override',
          entityType: 'attendance',
          entityId: existing.id,
          before,
          after: { ...existing, justification },
        });
      }
    }

    // Standard bulk audit log
    if (!isPast48Hours) {
      AuditService.recordLog({
        actorId: actor.id,
        action: 'attendance_roll_call_submitted',
        entityType: 'section_attendance',
        entityId: `${data.sectionId}_${data.date}`,
        after: { sectionId: data.sectionId, date: data.date, count: savedRecords.length },
      });
    }

    return { savedCount: savedRecords.length, records: savedRecords };
  },

  // ==========================================================================
  // 3. GUARDIAN PORTAL (Invite Flow, Approval, Read-Only Dossier)
  // ==========================================================================
  generateGuardianInviteCode(studentId: string, actor: { id: string; role?: string }): string {
    const isSelfOrStaff =
      actor.id === studentId || actor.role === 'admin' || actor.role === 'teacher';
    if (!isSelfOrStaff) {
      throw new Error('Not authorized to generate guardian invite code for this student.');
    }

    const code = `EDURAH-GRD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Store in existing or pending link
    let link = guardianLinksStore.find((l) => l.studentId === studentId && l.status === 'pending');
    if (link) {
      link.inviteCode = code;
      link.updatedAt = new Date().toISOString();
    } else {
      link = {
        id: `grd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        guardianId: '', // Unclaimed
        studentId,
        relationship: 'parent',
        status: 'pending',
        inviteCode: code,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      guardianLinksStore.push(link);
    }

    AuditService.recordLog({
      actorId: actor.id,
      action: 'guardian_invite_code_generated',
      entityType: 'guardian_link',
      entityId: link.id,
      after: { studentId, inviteCode: code },
    });

    return code;
  },

  claimStudentWithInviteCode(
    guardian: { id: string; name?: string; email?: string },
    inviteCode: string,
    relationship: string = 'parent'
  ): GuardianLink {
    const link = guardianLinksStore.find(
      (l) => l.inviteCode === inviteCode.trim().toUpperCase() && l.status === 'pending'
    );
    if (!link) {
      throw new Error('Invalid or expired guardian invitation code.');
    }

    link.guardianId = guardian.id;
    link.guardianName = guardian.name;
    link.guardianEmail = guardian.email;
    link.relationship = relationship;
    link.updatedAt = new Date().toISOString();

    AuditService.recordLog({
      actorId: guardian.id,
      action: 'guardian_link_claimed',
      entityType: 'guardian_link',
      entityId: link.id,
      after: { guardianId: guardian.id, studentId: link.studentId, status: 'pending' },
    });

    return link;
  },

  approveGuardianLink(linkId: string, actor: { id: string; role?: string }): GuardianLink {
    const link = guardianLinksStore.find((l) => l.id === linkId);
    if (!link) throw new Error('Guardian link request not found.');

    const isAuthorized = actor.id === link.studentId || actor.role === 'admin';
    if (!isAuthorized) {
      throw new Error('Only the linked student or a school administrator can approve this request.');
    }

    link.status = 'active';
    link.updatedAt = new Date().toISOString();

    AuditService.recordLog({
      actorId: actor.id,
      action: 'guardian_link_approved',
      entityType: 'guardian_link',
      entityId: link.id,
      after: { ...link },
    });

    return link;
  },

  revokeGuardianLink(linkId: string, actor: { id: string; role?: string }): GuardianLink {
    const link = guardianLinksStore.find((l) => l.id === linkId);
    if (!link) throw new Error('Guardian link not found.');

    const isAuthorized =
      actor.id === link.studentId || actor.id === link.guardianId || actor.role === 'admin';
    if (!isAuthorized) {
      throw new Error('Not authorized to revoke this guardian link.');
    }

    link.status = 'revoked';
    link.updatedAt = new Date().toISOString();

    AuditService.recordLog({
      actorId: actor.id,
      action: 'guardian_link_revoked',
      entityType: 'guardian_link',
      entityId: link.id,
      after: { ...link },
    });

    return link;
  },

  getGuardianStudentDossier(
    guardianId: string,
    studentId: string,
    studentProfile: { fullName: string; email: string; gradeId: string; academicBatch?: string }
  ): GuardianStudentDossier {
    // ENFORCE STRICT STATUS = ACTIVE
    const link = guardianLinksStore.find(
      (l) => l.guardianId === guardianId && l.studentId === studentId && l.status === 'active'
    );
    if (!link) {
      const error: any = new Error(
        'GUARDIAN_UNAUTHORIZED: Active guardian authorization link required to inspect student records.'
      );
      error.code = 'GUARDIAN_UNAUTHORIZED';
      throw error;
    }

    // 1. Attendance Summary
    const attSummary = this.getStudentAttendanceSummary(studentId);

    // 2. Upcoming Deadlines
    const courses = ContentService.getCoursesByGrade(studentProfile.gradeId);
    const upcomingDeadlines = [];

    for (const c of courses) {
      const assignments = AssignmentsRepository.getAssignmentsByCourse(c.id);
      for (const asg of assignments) {
        if (asg.dueAt && new Date(asg.dueAt) >= new Date()) {
          const sub = AssignmentsRepository.getLatestSubmission(asg.id, studentId);
          upcomingDeadlines.push({
            id: asg.id,
            title: asg.title,
            courseTitle: c.title,
            dueAt: asg.dueAt,
            points: asg.points,
            submitted: !!sub && sub.status === 'submitted',
          });
        }
      }
    }

    // 3. Published Grades Only
    const publishedGrades = courses.map((c) => {
      const calc = GradebookService.calculateStudentCourseGrade(studentId, c.id);
      return {
        courseId: c.id,
        courseTitle: c.title,
        weightedPercentage: calc.weightedPercentage,
        letterGrade: calc.letterGrade,
        isPassing: calc.isPassing,
        missingCount: calc.missingCount,
      };
    });

    const gradeObj = ContentService.getGradeById(studentProfile.gradeId);

    return {
      student: {
        id: studentId,
        fullName: studentProfile.fullName,
        email: studentProfile.email,
        gradeId: studentProfile.gradeId,
        gradeName: gradeObj?.name || studentProfile.gradeId,
        academicBatch: studentProfile.academicBatch,
      },
      attendance: {
        attendancePercentage: attSummary.attendancePercentage,
        totalDays: attSummary.totalDays,
        presentCount: attSummary.presentCount,
        absentCount: attSummary.absentCount,
        recentRecords: attSummary.records.slice(0, 10),
      },
      upcomingDeadlines: upcomingDeadlines.slice(0, 5),
      publishedGrades,
    };
  },

  // ==========================================================================
  // 4. LIVE CLASSES WITH JOIN WINDOWS
  // ==========================================================================
  getLiveSessions(courseId: string, sectionId?: string): LiveSession[] {
    const now = Date.now();
    return liveSessionsStore
      .filter((s) => s.courseId === courseId && (!sectionId || s.sectionId === sectionId))
      .map((session) => {
        const start = new Date(session.scheduledStart).getTime();
        const end = new Date(session.scheduledEnd).getTime();
        const windowOpen = start - 15 * 60 * 1000; // 15 mins prior

        const canJoin = now >= windowOpen && now <= end;
        let joinWindowMessage = 'Join window active';

        if (now < windowOpen) {
          const minsUntil = Math.round((windowOpen - now) / 60000);
          joinWindowMessage = `Opens in ${minsUntil} minutes`;
        } else if (now > end) {
          joinWindowMessage = 'Session concluded';
        }

        return {
          ...session,
          canJoin,
          joinWindowMessage,
        };
      })
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  },

  createLiveSession(
    data: {
      courseId: string;
      courseTitle?: string;
      sectionId?: string;
      title: string;
      provider: 'google_meet' | 'zoom' | 'teams';
      meetingUrl: string;
      scheduledStart: string;
      scheduledEnd: string;
    },
    host: { id: string; name: string; role?: string }
  ): LiveSession {
    if (host.role !== 'teacher' && host.role !== 'admin') {
      throw new Error('Faculty privileges required to schedule live classes.');
    }

    if (new Date(data.scheduledStart) >= new Date(data.scheduledEnd)) {
      throw new Error('Scheduled start time must precede scheduled end time.');
    }

    const session: LiveSession = {
      id: `live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      courseId: data.courseId,
      courseTitle: data.courseTitle,
      sectionId: data.sectionId,
      title: data.title,
      provider: data.provider,
      meetingUrl: data.meetingUrl,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      hostTeacherId: host.id,
      hostTeacherName: host.name,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    liveSessionsStore.unshift(session);

    AuditService.recordLog({
      actorId: host.id,
      action: 'live_session_scheduled',
      entityType: 'live_session',
      entityId: session.id,
      after: { ...session },
    });

    return session;
  },

  // ==========================================================================
  // 5. SERVER-SIDE LESSON PREREQUISITES VERIFIER
  // ==========================================================================
  async verifyLessonAccess(
    studentId: string,
    courseId: string,
    lessonId: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    prerequisiteLessonId?: string;
    prerequisiteLessonTitle?: string;
  }> {
    const course = ContentService.getCourseById(courseId);
    if (!course) return { allowed: true };

    const allLessons = course.chapters.flatMap((ch) => ch.lessons);
    const targetLesson = allLessons.find((l) => l.id === lessonId);
    if (!targetLesson || !targetLesson.prerequisiteLessonId) {
      return { allowed: true };
    }

    const prereqId = targetLesson.prerequisiteLessonId;
    const prereqLesson = allLessons.find((l) => l.id === prereqId);

    // Query authoritative Supabase lesson_progress
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data } = await supabaseAdmin
        .from('lesson_progress')
        .select('completed')
        .eq('user_id', studentId)
        .eq('lesson_id', prereqId)
        .eq('completed', true)
        .maybeSingle();

      if (!data?.completed) {
        return {
          allowed: false,
          reason: 'PREREQUISITE_NOT_MET',
          prerequisiteLessonId: prereqId,
          prerequisiteLessonTitle: prereqLesson?.title || 'Prerequisite Lesson',
        };
      }
    } catch {
      // Fallback
    }

    return { allowed: true };
  },
};
