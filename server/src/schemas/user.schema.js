import { z } from 'zod';

export const UserRoleEnum = z.enum(['admin', 'organizer', 'participant', 'guest']);
export const OrganizerRequestStatusEnum = z.enum(['none', 'pending', 'approved', 'rejected']);
export const OrganizerStatusEnum = OrganizerRequestStatusEnum;

export const UserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  role: UserRoleEnum.default('participant'),
  photoURL: z.string().nullable().optional().default(null),
  department: z.string().trim().nullable().optional().default(null),
  studentId: z.string().trim().nullable().optional().default(null),
  mobileNumber: z.string().trim().nullable().optional().default(null),
  batch: z.string().trim().nullable().optional().default(null),
  section: z.string().trim().nullable().optional().default(null),
  level: z.union([z.number(), z.string()]).nullable().optional().default(null),
  term: z.union([z.number(), z.string()]).nullable().optional().default(null),
  clubAffiliation: z.string().trim().nullable().optional().default(null),
  designation: z.string().trim().nullable().optional().default(null),
  office: z.string().trim().nullable().optional().default(null),
  officeLocation: z.string().trim().nullable().optional().default(null),
  authorityScope: z.string().trim().nullable().optional().default(null),
  bio: z.string().trim().nullable().optional().default(null),
  roleProfiles: z.record(z.any()).optional().default({}),
  organizerRequestStatus: OrganizerRequestStatusEnum.default('none'),
  organizerStatus: OrganizerStatusEnum.default('none'),
  organizerRejectionReason: z.string().trim().nullable().optional().default(null),
  organizerApplicationDetails: z.record(z.any()).nullable().optional().default(null),
  createdAt: z.union([z.date(), z.string(), z.any()]).optional(),
  updatedAt: z.union([z.date(), z.string(), z.any()]).optional(),
}).passthrough();

export const UpdateUserSchema = UserSchema.partial().omit({ email: true, createdAt: true });

export const OrganizerStatusUpdateSchema = z.object({
  organizerRequestStatus: OrganizerRequestStatusEnum.optional(),
  organizerStatus: OrganizerStatusEnum.optional(),
  clubAffiliation: z.string().trim().nullable().optional(),
});

export const RequestOrganizerSchema = z
  .object({
    clubAffiliation: z.string().trim().min(1, 'Club affiliation is required').optional(),
    club: z.string().trim().min(1, 'Club is required').optional(),
    name: z.string().trim().optional(),
    studentId: z.string().trim().optional(),
    batch: z.string().trim().optional(),
    department: z.string().trim().optional(),
    mobileNumber: z.string().trim().optional(),
    designation: z.string().trim().optional(),
    reason: z.string().trim().optional(),
    statement: z.string().trim().optional(),
  })
  .refine((data) => data.clubAffiliation || data.club, {
    message: 'Club selection is required',
  });

export const ApproveOrganizerSchema = z
  .object({
    userId: z.string().trim().min(1, 'userId is required').optional(),
    id: z.string().trim().min(1, 'id is required').optional(),
  })
  .refine((data) => data.userId || data.id, {
    message: 'User ID (userId) is required',
  });

export const RejectOrganizerSchema = z
  .object({
    userId: z.string().trim().min(1, 'userId is required').optional(),
    id: z.string().trim().min(1, 'id is required').optional(),
    rejectionReason: z.string().trim().nullable().optional(),
    reason: z.string().trim().nullable().optional(),
  })
  .refine((data) => data.userId || data.id, {
    message: 'User ID (userId) is required',
  });

export const UpdateStudentProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  photoURL: z.string().nullable().optional(),
  department: z.string().trim().nullable().optional(),
  studentId: z.string().trim().nullable().optional(),
  mobileNumber: z.string().trim().nullable().optional(),
  batch: z.string().trim().nullable().optional(),
  section: z.string().trim().nullable().optional(),
  level: z.union([z.number(), z.string()]).nullable().optional(),
  term: z.union([z.number(), z.string()]).nullable().optional(),
  clubAffiliation: z.string().trim().nullable().optional(),
  designation: z.string().trim().nullable().optional(),
  office: z.string().trim().nullable().optional(),
  officeLocation: z.string().trim().nullable().optional(),
  authorityScope: z.string().trim().nullable().optional(),
  bio: z.string().trim().nullable().optional(),
  roleProfiles: z.record(z.any()).optional(),
}).passthrough();

export const AdminUpdateUserRoleSchema = z
  .object({
    role: UserRoleEnum.optional(),
    organizerRequestStatus: OrganizerRequestStatusEnum.optional(),
    organizerStatus: OrganizerStatusEnum.optional(),
    clubAffiliation: z.string().trim().nullable().optional(),
  })
  .refine(
    (data) =>
      data.role !== undefined ||
      data.organizerRequestStatus !== undefined ||
      data.organizerStatus !== undefined ||
      data.clubAffiliation !== undefined,
    {
      message: 'At least one field to update must be provided',
    }
  );

export const ListUsersQuerySchema = z.object({
  role: UserRoleEnum.optional(),
  organizerRequestStatus: OrganizerRequestStatusEnum.optional(),
  organizerStatus: OrganizerStatusEnum.optional(),
  clubAffiliation: z.string().optional(),
});
