import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import userService from '../services/userService.js';

export const BAUST_DEPARTMENTS = [
  'Computer Science and Engineering (CSE)',
  'Electrical and Electronic Engineering (EEE)',
  'Civil Engineering (CE)',
  'Mechanical Engineering (ME)',
  'Industrial and Production Engineering (IPE)',
  'Business Administration (BBA)',
  'English',
  'Other / General',
];

export const BAUST_CLUBS = [
  'BAUST Computer Club (BCC)',
  'Career Society of BAUST (CSB)',
  'Environment and Sustainability Club (ESC)',
  'Civil Engineering Innovation Club (CEIC)',
  'CSE Society of BAUST',
  'BAUST Business Club',
  'BAUST Career Club',
  'BAUST Debating Society',
  'IEEE Student Branch, BAUST',
  'IEOM BAUST Student Chapter',
  'Cultural Club, BAUST',
  'BAUST Sports Club',
  'BAUST Robotics Club',
  'BAUST Photography Club',
  'BAUST Language Club',
  'BAUST Social Welfare Club',
  'BAUST Science Club',
  'BAUST Entrepreneurship Club',
  'BAUST Volunteer Club',
  'English Language and Literary Society (ELLS)',
  'BAUST Alumni Society',
];

export const BAUST_ADMIN_OFFICES = [
  'Office of Student Affairs (OSA)',
  'Office of the Registrar',
  'Office of the Vice-Chancellor (VC Office)',
  'Proctorial Office',
  'Information & Communication Technology (ICT) Cell',
  'Office of the Dean, Faculty of Electrical and Computer Engineering',
  'Office of the Dean, Faculty of Civil Engineering',
  'Office of the Dean, Faculty of Mechanical Engineering',
  'Office of the Dean, Faculty of Business Studies',
  'Controller of Examinations (CoE)',
  'Central University Governance Board',
];

export const BAUST_ADMIN_DESIGNATIONS = [
  'Director of Student Affairs (DSA)',
  'Super Administrator / Governance Lead',
  'System Administrator (ICT Cell)',
  'Registrar / Assistant Registrar',
  'Proctor / Assistant Proctor',
  'Faculty Advisor & Event Coordinator',
  'Administrative Governance Officer',
  'Executive Coordinator (OSA)',
];

export const BAUST_ORGANIZER_DESIGNATIONS = [
  'President',
  'Vice President',
  'General Secretary',
  'Joint Secretary',
  'Treasurer / Finance Secretary',
  'Event Coordinator / Convener',
  'Technical Lead',
  'Public Relations (PR) Secretary',
  'Executive Committee Member',
];

export default function ProfilePage() {
  const { user, refreshUser, deleteAccount, setUser } = useAuth();
  const navigate = useNavigate();

  // Photo management state
  const fileInputRef = React.useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState(null);
  const [photoErrorMsg, setPhotoErrorMsg] = useState(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [viewingFullPhoto, setViewingFullPhoto] = useState(false);

  // Account deletion state
  const [deletingAccount, setDeletingAccount] = useState(false);

  // 1. Student / Participant profile form state
  const [studentForm, setStudentForm] = useState({
    name: '',
    department: '',
    studentId: '',
    mobileNumber: '',
    batch: '',
    section: '',
    level: '',
    term: '',
  });

  // 2. Club Organizer profile form state
  const [organizerForm, setOrganizerForm] = useState({
    name: '',
    clubAffiliation: '',
    designation: '',
    department: '',
    mobileNumber: '',
    officeLocation: '',
    bio: '',
  });

  // 3. Admin profile form state
  const [adminForm, setAdminForm] = useState({
    name: '',
    office: '',
    designation: '',
    mobileNumber: '',
    officeLocation: '',
    authorityScope: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState(null);

  // Organizer request state (for Participants only)
  const [selectedClub, setSelectedClub] = useState('');
  const [organizerAppForm, setOrganizerAppForm] = useState({
    name: '',
    studentId: '',
    department: '',
    batch: '',
    mobileNumber: '',
    clubAffiliation: '',
    designation: '',
    reason: '',
  });
  const [requestingOrganizer, setRequestingOrganizer] = useState(false);
  const [organizerMsg, setOrganizerMsg] = useState(null);
  const [organizerErrorMsg, setOrganizerErrorMsg] = useState(null);
  const [showOrganizerForm, setShowOrganizerForm] = useState(false);

  // Acknowledged / Dismissed organizer rejection notice state
  const getIsRejectionDismissed = () => {
    if (typeof window === 'undefined' || !user) return false;
    return localStorage.getItem(`baust_rejection_ack_${user.uid || user.id}`) === 'true';
  };

  const [rejectionDismissed, setRejectionDismissed] = useState(getIsRejectionDismissed);
  const [dismissingRejection, setDismissingRejection] = useState(false);

  useEffect(() => {
    if (user?.uid || user?.id) {
      setRejectionDismissed(
        localStorage.getItem(`baust_rejection_ack_${user.uid || user.id}`) === 'true'
      );
    }
  }, [user?.uid, user?.id]);

  const handleDismissRejection = async () => {
    setRejectionDismissed(true);
    if (user?.uid || user?.id) {
      localStorage.setItem(`baust_rejection_ack_${user.uid || user.id}`, 'true');
    }
    try {
      setDismissingRejection(true);
      await userService.dismissRejectionNotice();
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.warn('Failed to dismiss rejection notice:', err);
    } finally {
      setDismissingRejection(false);
    }
  };

  // If user visits Profile page and checks/sees the rejection, automatically dismiss when navigating away
  useEffect(() => {
    const raw = user?.organizerRequestStatus || user?.organizerStatus;
    if (raw === 'rejected') {
      return () => {
        if (user?.uid || user?.id) {
          localStorage.setItem(`baust_rejection_ack_${user.uid || user.id}`, 'true');
        }
        userService.dismissRejectionNotice().catch(() => {});
      };
    }
  }, [user?.uid, user?.id, user?.organizerRequestStatus, user?.organizerStatus]);

  // Sync state strictly with user role profiles
  useEffect(() => {
    if (user) {
      const pData = user.roleProfiles?.participant || {};
      const oData = user.roleProfiles?.organizer || {};
      const aData = user.roleProfiles?.admin || {};

      setStudentForm({
        name: pData.name || user.name || '',
        department: pData.department || (user.role === 'participant' ? user.department : '') || '',
        studentId: pData.studentId || (user.role === 'participant' ? user.studentId : '') || '',
        mobileNumber: pData.mobileNumber || (user.role === 'participant' ? user.mobileNumber : '') || '',
        batch: pData.batch || (user.role === 'participant' ? user.batch : '') || '',
        section: pData.section || (user.role === 'participant' ? user.section : '') || '',
        level: pData.level !== null && pData.level !== undefined ? String(pData.level) : (user.role === 'participant' && user.level ? String(user.level) : ''),
        term: pData.term !== null && pData.term !== undefined ? String(pData.term) : (user.role === 'participant' && user.term ? String(user.term) : ''),
      });

      setOrganizerForm({
        name: oData.name || user.name || '',
        clubAffiliation: oData.clubAffiliation || user.clubAffiliation || 'CSE Society of BAUST',
        designation: oData.designation || user.designation || 'Event Coordinator',
        department: oData.department || (user.role === 'organizer' ? user.department : '') || 'Computer Science and Engineering (CSE)',
        mobileNumber: oData.mobileNumber || (user.role === 'organizer' ? user.mobileNumber : '') || '',
        officeLocation: oData.officeLocation || user.officeLocation || '',
        bio: oData.bio || user.bio || '',
      });

      setAdminForm({
        name: aData.name || user.name || '',
        office: aData.office || user.office || 'Office of Student Affairs (OSA)',
        designation: aData.designation || user.designation || 'System Administrator / Super Admin',
        mobileNumber: aData.mobileNumber || (user.role === 'admin' ? user.mobileNumber : '') || '',
        officeLocation: aData.officeLocation || user.officeLocation || 'Admin Building, 2nd Floor, Room 204',
        authorityScope: aData.authorityScope || user.authorityScope || 'Central University Event Approvals & Governance',
      });

      setSelectedClub(oData.clubAffiliation || user.clubAffiliation || 'CSE Society of BAUST');
      
      const appData = user.organizerApplicationDetails || {};
      setOrganizerAppForm({
        name: appData.name || pData.name || user.name || '',
        studentId: appData.studentId || pData.studentId || (user.role === 'participant' ? user.studentId : '') || '',
        department: appData.department || pData.department || (user.role === 'participant' ? user.department : '') || '',
        batch: appData.batch || pData.batch || (user.role === 'participant' ? user.batch : '') || '',
        mobileNumber: appData.mobileNumber || pData.mobileNumber || (user.role === 'participant' ? user.mobileNumber : '') || '',
        clubAffiliation: appData.clubAffiliation || user.clubAffiliation || oData.clubAffiliation || '',
        designation: appData.designation || user.designation || 'Event Coordinator',
        reason: appData.reason || '',
      });

      setPhotoPreview(user.photoURL || null);
    }
  }, [user]);

  /**
   * Helper to square-crop and compress image client-side to lightweight JPEG (max 320x320)
   */
  const compressImage = (file, size = 320, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          // Center square crop
          const minEdge = Math.min(img.width, img.height);
          const startX = (img.width - minEdge) / 2;
          const startY = (img.height - minEdge) / 2;

          ctx.drawImage(img, startX, startY, minEdge, minEdge, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Invalid image file format'));
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoErrorMsg(null);
      setPhotoSuccessMsg(null);

      const compressedDataUrl = await compressImage(file, 320, 0.85);
      setPhotoPreview(compressedDataUrl);

      // Persist directly to user profile in Firestore
      const updated = await userService.updateMyProfile({ photoURL: compressedDataUrl });
      if (setUser) setUser(updated);
      if (refreshUser) await refreshUser();
      setPhotoSuccessMsg('Profile photo updated and saved successfully!');
    } catch (err) {
      setPhotoErrorMsg(
        err.response?.data?.error?.message || err.message || 'Failed to save profile photo'
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePhotoUrl = async (e) => {
    e.preventDefault();
    if (!urlInput || !urlInput.trim()) {
      setPhotoErrorMsg('Please enter a valid image URL');
      return;
    }

    const trimmed = urlInput.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      setPhotoErrorMsg('URL must start with http:// or https://');
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoErrorMsg(null);
      setPhotoSuccessMsg(null);

      const updated = await userService.updateMyProfile({ photoURL: trimmed });
      setPhotoPreview(trimmed);
      if (setUser) setUser(updated);
      if (refreshUser) await refreshUser();
      setPhotoSuccessMsg('Profile photo updated successfully!');
      setShowUrlModal(false);
      setUrlInput('');
    } catch (err) {
      setPhotoErrorMsg(
        err.response?.data?.error?.message || err.message || 'Failed to save photo URL'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    const confirmed = window.confirm('Are you sure you want to remove your profile photo?');
    if (!confirmed) return;

    try {
      setUploadingPhoto(true);
      setPhotoErrorMsg(null);
      setPhotoSuccessMsg(null);

      const updated = await userService.updateMyProfile({ photoURL: null });
      setPhotoPreview(null);
      if (setUser) setUser(updated);
      if (refreshUser) await refreshUser();
      setPhotoSuccessMsg('Profile photo removed.');
    } catch (err) {
      setPhotoErrorMsg(
        err.response?.data?.error?.message || err.message || 'Failed to remove photo'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 1. Participant form handlers
  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileSuccessMsg(null);
      setProfileErrorMsg(null);

      const payload = {
        name: studentForm.name ? studentForm.name.trim() : undefined,
        department: studentForm.department ? studentForm.department.trim() : null,
        studentId: studentForm.studentId ? studentForm.studentId.trim() : null,
        mobileNumber: studentForm.mobileNumber ? studentForm.mobileNumber.trim() : null,
        batch: studentForm.batch ? studentForm.batch.trim() : null,
        section: studentForm.section ? studentForm.section.trim() : null,
        level: studentForm.level ? Number(studentForm.level) || studentForm.level : null,
        term: studentForm.term ? Number(studentForm.term) || studentForm.term : null,
      };

      const updated = await userService.updateMyProfile(payload);
      if (setUser) setUser(updated);
      await refreshUser();
      setProfileSuccessMsg('Student Academic Profile saved successfully!');
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to update student profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Club Organizer form handlers
  const handleOrganizerChange = (e) => {
    const { name, value } = e.target;
    setOrganizerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrganizerSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileSuccessMsg(null);
      setProfileErrorMsg(null);

      const payload = {
        name: organizerForm.name ? organizerForm.name.trim() : undefined,
        clubAffiliation: organizerForm.clubAffiliation ? organizerForm.clubAffiliation.trim() : null,
        designation: organizerForm.designation ? organizerForm.designation.trim() : null,
        department: organizerForm.department ? organizerForm.department.trim() : null,
        mobileNumber: organizerForm.mobileNumber ? organizerForm.mobileNumber.trim() : null,
        officeLocation: organizerForm.officeLocation ? organizerForm.officeLocation.trim() : null,
        bio: organizerForm.bio ? organizerForm.bio.trim() : null,
      };

      const updated = await userService.updateMyProfile(payload);
      if (setUser) setUser(updated);
      await refreshUser();
      setProfileSuccessMsg('Club Organizer Profile saved successfully!');
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to update organizer profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // 3. Admin form handlers
  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileSuccessMsg(null);
      setProfileErrorMsg(null);

      const payload = {
        name: adminForm.name ? adminForm.name.trim() : undefined,
        office: adminForm.office ? adminForm.office.trim() : null,
        designation: adminForm.designation ? adminForm.designation.trim() : null,
        mobileNumber: adminForm.mobileNumber ? adminForm.mobileNumber.trim() : null,
        officeLocation: adminForm.officeLocation ? adminForm.officeLocation.trim() : null,
        authorityScope: adminForm.authorityScope ? adminForm.authorityScope.trim() : null,
      };

      const updated = await userService.updateMyProfile(payload);
      if (setUser) setUser(updated);
      await refreshUser();
      setProfileSuccessMsg('Administrative Governance Profile saved successfully!');
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to update administrative profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOrganizerAppChange = (e) => {
    const { name, value } = e.target;
    setOrganizerAppForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrganizerRequestSubmit = async (e) => {
    e.preventDefault();
    const targetClub = organizerAppForm.clubAffiliation || selectedClub;
    if (!targetClub) {
      setOrganizerErrorMsg('Please select your BAUST Club or Society');
      return;
    }
    if (!organizerAppForm.name?.trim()) {
      setOrganizerErrorMsg('Full Name is required');
      return;
    }
    if (!organizerAppForm.studentId?.trim()) {
      setOrganizerErrorMsg('Student ID is required');
      return;
    }
    if (!organizerAppForm.department?.trim()) {
      setOrganizerErrorMsg('Academic Department is required');
      return;
    }
    if (!organizerAppForm.batch?.trim()) {
      setOrganizerErrorMsg('Batch is required');
      return;
    }
    if (!organizerAppForm.mobileNumber?.trim()) {
      setOrganizerErrorMsg('Mobile contact number is required');
      return;
    }

    try {
      setRequestingOrganizer(true);
      setOrganizerMsg(null);
      setOrganizerErrorMsg(null);
      if (user?.uid || user?.id) {
        localStorage.removeItem(`baust_rejection_ack_${user.uid || user.id}`);
      }

      await userService.requestOrganizer({
        clubAffiliation: targetClub,
        name: organizerAppForm.name.trim(),
        studentId: organizerAppForm.studentId.trim(),
        department: organizerAppForm.department.trim(),
        batch: organizerAppForm.batch.trim(),
        mobileNumber: organizerAppForm.mobileNumber.trim(),
        designation: organizerAppForm.designation?.trim() || 'Club Organizer',
        reason: organizerAppForm.reason?.trim() || '',
      });
      await refreshUser();
      navigate('/pending-approval', { replace: true });
    } catch (err) {
      setOrganizerErrorMsg(
        err.response?.data?.error?.message || err.message || 'Failed to submit organizer request'
      );
    } finally {
      setRequestingOrganizer(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure? All your data will be permanently deleted and this cannot be undone.'
    );
    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      await deleteAccount();
      navigate('/', {
        replace: true,
        state: { successMessage: 'Account deleted successfully' },
      });
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  const rawStatus = user?.organizerRequestStatus || user?.organizerStatus || 'none';
  const currentStatus = rawStatus === 'rejected' && rejectionDismissed ? 'none' : rawStatus;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#14213D] text-[#FCA311] border border-[#FCA311]/40 shadow-xs">Admin</span>;
      case 'organizer':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#FCA311]/20 text-[#14213D] border border-[#FCA311] shadow-xs">Organizer</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#E5E5E5] text-[#14213D] border border-[#E5E5E5]">Participant</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#fff8eb] text-[#14213D] border border-[#FCA311] animate-pulse">Pending Review</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#E5E5E5] text-slate-700 border border-[#E5E5E5]">None</span>;
    }
  };

  const canApplyForOrganizer =
    user?.role === 'participant' && (currentStatus === 'none' || currentStatus === 'rejected');

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Interactive Avatar with Camera Badge */}
            <div className="relative group flex-shrink-0">
              <div
                onClick={() => setViewingFullPhoto(true)}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#14213D] text-[#FCA311] ring-4 ring-[#FCA311]/30 flex items-center justify-center font-black text-2xl shadow-inner cursor-pointer hover:ring-[#FCA311] transition"
                title="Click to view full profile photo"
              >
                {photoPreview || user?.photoURL ? (
                  <img
                    src={photoPreview || user.photoURL}
                    alt={user?.name || 'Profile'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] shadow-md border-2 border-white transition transform hover:scale-110 cursor-pointer disabled:opacity-50"
                title="Change profile picture"
                aria-label="Upload photo"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-[#14213D]">{user?.name}</h1>
              <p className="text-sm text-slate-500 font-medium">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {getRoleBadge(user?.role)}
                {user?.clubAffiliation && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#14213D]/10 text-[#14213D] border border-[#14213D]/20">
                    🏛️ {user.clubAffiliation}
                  </span>
                )}
              </div>
            </div>
          </div>

          {user?.role === 'participant' && (
            <div className="bg-[#F8F9FA] border border-[#E5E5E5] rounded-xl p-3 text-sm">
              <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Organizer Status</span>
              <div className="mt-1">{getStatusBadge(currentStatus)}</div>
            </div>
          )}
          {user?.role === 'organizer' && (
            <div className="bg-amber-50/70 border border-[#FCA311]/40 rounded-xl p-3 text-sm">
              <span className="text-xs text-amber-900 block font-bold uppercase tracking-wider">Assigned Club</span>
              <div className="mt-1 text-xs font-bold text-[#14213D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{user?.clubAffiliation || 'Club Executive'}</span>
              </div>
            </div>
          )}
          {user?.role === 'admin' && (
            <div className="bg-[#14213D]/5 border border-[#14213D]/20 rounded-xl p-3 text-sm">
              <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider">Governance Role</span>
              <div className="mt-1 text-xs font-extrabold text-[#14213D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>University Authority / Super Admin</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Profile Photo & Identity Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              onClick={() => setViewingFullPhoto(true)}
              className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-inner cursor-pointer hover:ring-2 hover:ring-[#FCA311] transition group"
              title="Click to view full photo"
            >
              {photoPreview || user?.photoURL ? (
                <img
                  src={photoPreview || user.photoURL}
                  alt={user?.name || 'Avatar'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <span className="text-slate-400 font-bold text-xl">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#14213D]">Profile Photo &amp; Avatar</h2>
                {user?.photoURL ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Saved ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Default Avatar
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Upload your picture so event organizers, teachers, and club members can recognize you on attendee passes and directories.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setViewingFullPhoto(true)}
              className="px-3.5 py-2 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="See your profile photo in full size"
            >
              <span>👁️</span>
              <span>See Profile Photo</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] text-xs font-extrabold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>📷</span>
              <span>{uploadingPhoto ? 'Processing...' : 'Upload Photo'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUrlModal(!showUrlModal)}
              disabled={uploadingPhoto}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>🔗</span>
              <span>Image Link</span>
            </button>

            {(photoPreview || user?.photoURL) && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploadingPhoto}
                className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl border border-rose-200 transition cursor-pointer disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Expandable Image URL Input */}
        {showUrlModal && (
          <form onSubmit={handleSavePhotoUrl} className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste direct image URL (e.g. https://...)"
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#FCA311] focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={uploadingPhoto || !urlInput.trim()}
                className="px-4 py-2 bg-[#14213D] hover:bg-black text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                Save Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUrlModal(false);
                  setUrlInput('');
                }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Status Feedbacks */}
        {photoSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <span className="font-bold">✓</span>
            <span>{photoSuccessMsg}</span>
          </div>
        )}
        {photoErrorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <span className="font-bold">⚠️</span>
            <span>{photoErrorMsg}</span>
          </div>
        )}
      </div>

      {/* Organizer Access Section (Only for Student Participants) */}
      {user?.role === 'participant' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <h2 className="text-lg font-bold text-slate-800">Request Organizer Access</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Organizers can publish events, manage registrations, record expenses, and run attendee polls.
              Each official BAUST club is strictly limited to a maximum of <strong>2 organizers</strong>.
            </p>
          </div>

          {/* Status: Pending */}
          {currentStatus === 'pending' && (
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 rounded-2xl text-slate-800 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                <div className="flex items-center gap-2.5 font-bold text-amber-900 text-sm sm:text-base">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs animate-pulse">
                    ⏳
                  </div>
                  <div>
                    <span className="block">Organizer Application Under Review</span>
                    <span className="text-[11px] font-normal text-amber-700 block">
                      Awaiting administrative approval from OSA / System Admins
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto">
                  Pending Review
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                You have applied for organizer privileges for <strong className="text-amber-950 font-bold">{user?.clubAffiliation || organizerAppForm.clubAffiliation || 'your club'}</strong>. University administrators will review your academic cohort information and club capacity (max 2 organizers per club).
              </p>

              {/* Submitted Profile Details Grid */}
              <div className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Applicant Name</span>
                  <span className="font-bold text-slate-800">
                    {user?.organizerApplicationDetails?.name || user?.name || organizerAppForm.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Student ID &amp; Batch</span>
                  <span className="font-bold text-slate-800">
                    {user?.organizerApplicationDetails?.studentId || user?.studentId || organizerAppForm.studentId || 'N/A'} • {user?.organizerApplicationDetails?.batch || user?.batch || organizerAppForm.batch || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Academic Department</span>
                  <span className="font-bold text-slate-800">
                    {user?.organizerApplicationDetails?.department || user?.department || organizerAppForm.department || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Contact / Phone</span>
                  <span className="font-bold text-slate-800">
                    {user?.organizerApplicationDetails?.mobileNumber || user?.mobileNumber || organizerAppForm.mobileNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Requested Club / Society</span>
                  <span className="font-bold text-[#14213D] inline-flex items-center gap-1">
                    🏛️ {user?.clubAffiliation || user?.organizerApplicationDetails?.clubAffiliation || organizerAppForm.clubAffiliation}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Executive Designation / Role</span>
                  <span className="font-bold text-indigo-700">
                    {user?.organizerApplicationDetails?.designation || user?.designation || organizerAppForm.designation || 'Club Organizer'}
                  </span>
                </div>
                {(user?.organizerApplicationDetails?.reason || user?.bio || organizerAppForm.reason) && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[11px] font-semibold mb-1">Statement of Purpose / Why Applying</span>
                    <p className="text-slate-700 italic bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      "{user?.organizerApplicationDetails?.reason || user?.bio || organizerAppForm.reason}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status: Rejected */}
          {currentStatus === 'rejected' && canApplyForOrganizer && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-2 relative transition-all shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                  <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Previous Application Status: Declined</span>
                </div>
                <button
                  type="button"
                  onClick={handleDismissRejection}
                  disabled={dismissingRejection}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 rounded-lg transition cursor-pointer"
                  title="Dismiss this notice (won't show again)"
                >
                  <span>Dismiss</span>
                  <span className="text-base leading-none">&times;</span>
                </button>
              </div>
              <p className="text-xs text-rose-800">
                Your previous organizer request for <strong>{user?.clubAffiliation || 'the club'}</strong> was not approved by administration.
              </p>
              {user?.organizerRejectionReason && (
                <div className="p-2.5 bg-white rounded-lg border border-rose-200 text-slate-700 text-xs">
                  <span className="font-semibold text-rose-900">Administrative Feedback: </span>
                  {user.organizerRejectionReason}
                </div>
              )}
              <p className="text-slate-600 text-[11px] pt-1">
                You remain active as a Student Participant. You may submit a new application with updated details below.
              </p>
            </div>
          )}

          {/* Option Button / Trigger Card: "Request to become an Organizer" */}
          {canApplyForOrganizer && !showOrganizerForm && (
            <div className="mt-4 p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#14213D] text-[#FCA311] flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                  🏛️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      Request to become an Organizer
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      Club Access
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Are you an executive of a BAUST student club? Click below to open the application form and request organizer privileges.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOrganizerForm(true)}
                className="px-5 py-2.5 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 rounded-xl text-xs font-bold transition shadow-md shadow-[#14213D]/20 flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>🏛️</span>
                <span>Request to become an Organizer</span>
                <span>&rarr;</span>
              </button>
            </div>
          )}

          {/* Application Form (shown when user clicks "Request to become an Organizer") */}
          {canApplyForOrganizer && showOrganizerForm && (
            <form onSubmit={handleOrganizerRequestSubmit} className="mt-4 p-5 sm:p-6 bg-slate-50/60 border border-slate-200 rounded-2xl space-y-5 animate-fade-in shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Organizer Application Form</h3>
                    <p className="text-[11px] text-slate-500">Fill in your information and submit to university administrators for verification.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrganizerForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                >
                  ✕ Close Form
                </button>
              </div>
              {organizerMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
                  {organizerMsg}
                </div>
              )}

              {organizerErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                  {organizerErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="orgAppName" className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="orgAppName"
                    name="name"
                    value={organizerAppForm.name}
                    onChange={handleOrganizerAppChange}
                    required
                    placeholder="Your legal/university name"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                  />
                </div>

                {/* Student ID */}
                <div>
                  <label htmlFor="orgAppStudentId" className="block text-xs font-semibold text-slate-700 mb-1">
                    Student ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="orgAppStudentId"
                    name="studentId"
                    value={organizerAppForm.studentId}
                    onChange={handleOrganizerAppChange}
                    required
                    placeholder="e.g. 200201045"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                  />
                </div>

                {/* Academic Department */}
                <div>
                  <label htmlFor="orgAppDepartment" className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="orgAppDepartment"
                    name="department"
                    value={organizerAppForm.department}
                    onChange={handleOrganizerAppChange}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                  >
                    <option value="">-- Select Department --</option>
                    {BAUST_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch */}
                <div>
                  <label htmlFor="orgAppBatch" className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="orgAppBatch"
                    name="batch"
                    value={organizerAppForm.batch}
                    onChange={handleOrganizerAppChange}
                    required
                    placeholder="e.g. 10th Batch"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                  />
                </div>

                {/* Mobile Contact Number */}
                <div>
                  <label htmlFor="orgAppMobile" className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact / Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="orgAppMobile"
                    name="mobileNumber"
                    value={organizerAppForm.mobileNumber}
                    onChange={handleOrganizerAppChange}
                    required
                    placeholder="e.g. 017xxxxxxxx"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                  />
                </div>

                {/* Proposed Role / Designation */}
                <div>
                  <label htmlFor="orgAppDesignation" className="block text-xs font-semibold text-slate-700 mb-1">
                    Proposed Designation / Role <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="orgAppDesignation"
                    name="designation"
                    list="designationSuggestions"
                    value={organizerAppForm.designation}
                    onChange={handleOrganizerAppChange}
                    required
                    placeholder="e.g. Event Coordinator, General Secretary"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                  />
                  <datalist id="designationSuggestions">
                    <option value="President" />
                    <option value="Vice President" />
                    <option value="General Secretary" />
                    <option value="Event Coordinator" />
                    <option value="Organizing Secretary" />
                    <option value="Technical Secretary" />
                    <option value="Treasurer / Finance Executive" />
                    <option value="Executive Member" />
                  </datalist>
                </div>

                {/* Club Affiliation Dropdown */}
                <div className="sm:col-span-2">
                  <label htmlFor="clubSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Your BAUST Club / Organization <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="clubSelect"
                    name="clubAffiliation"
                    value={organizerAppForm.clubAffiliation}
                    onChange={handleOrganizerAppChange}
                    disabled={requestingOrganizer}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                  >
                    <option value="">-- Choose an Official BAUST Club / Society --</option>
                    {BAUST_CLUBS.map((club) => (
                      <option key={club} value={club}>
                        {club}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Only apply if you are an authorized executive or appointed organizer of this student organization.
                  </p>
                </div>

                {/* Statement of Purpose / Reason */}
                <div className="sm:col-span-2">
                  <label htmlFor="orgAppReason" className="block text-xs font-semibold text-slate-700 mb-1">
                    Statement of Purpose &amp; Relevant Experience <span className="text-slate-400">(Important Information)</span>
                  </label>
                  <textarea
                    id="orgAppReason"
                    name="reason"
                    rows={3}
                    value={organizerAppForm.reason}
                    onChange={handleOrganizerAppChange}
                    placeholder="Briefly state your current executive responsibility in this club, past event coordination experience, or why administration should grant you organizer access..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This information will be displayed directly to University Administrators to verify your legitimacy.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowOrganizerForm(false)}
                  className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingOrganizer || !organizerAppForm.clubAffiliation}
                  className="px-6 py-3 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {requestingOrganizer ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Organizer Application</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ROLE 1: Admin Governance Profile */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <h2 className="text-lg font-extrabold text-[#14213D]">Administrative &amp; Governance Profile</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#14213D] text-[#FCA311] border border-[#FCA311]/40">
                  Authority
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Institutional authority, governance scope, and official administrative credentials for BAUST campus operations.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
              Role: Admin
            </span>
          </div>

          {profileSuccessMsg && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
              <span className="font-bold">✓</span>
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label htmlFor="adminName" className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Full Name
                </label>
                <input
                  type="text"
                  id="adminName"
                  name="name"
                  value={adminForm.name}
                  onChange={handleAdminChange}
                  placeholder="e.g. Prof. / Dr. / Engr. Full Name"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition bg-white"
                />
              </div>

              {/* Administrative Office */}
              <div className="sm:col-span-2">
                <label htmlFor="adminOffice" className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrative Office / Directorate
                </label>
                <select
                  id="adminOffice"
                  name="office"
                  value={adminForm.office}
                  onChange={handleAdminChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition bg-white"
                >
                  <option value="">-- Select Office / Directorate --</option>
                  {BAUST_ADMIN_OFFICES.map((off) => (
                    <option key={off} value={off}>
                      {off}
                    </option>
                  ))}
                </select>
              </div>

              {/* Designation */}
              <div>
                <label htmlFor="adminDesignation" className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Designation / Title
                </label>
                <select
                  id="adminDesignation"
                  name="designation"
                  value={adminForm.designation}
                  onChange={handleAdminChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition bg-white"
                >
                  <option value="">-- Select Designation --</option>
                  {BAUST_ADMIN_DESIGNATIONS.map((des) => (
                    <option key={des} value={des}>
                      {des}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="adminMobile" className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Contact / Mobile Number
                </label>
                <input
                  type="tel"
                  id="adminMobile"
                  name="mobileNumber"
                  value={adminForm.mobileNumber}
                  onChange={handleAdminChange}
                  placeholder="e.g. 01700000000"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                />
              </div>

              {/* Office Location */}
              <div>
                <label htmlFor="adminLocation" className="block text-xs font-semibold text-slate-700 mb-1">
                  Office Location / Room Number
                </label>
                <input
                  type="text"
                  id="adminLocation"
                  name="officeLocation"
                  value={adminForm.officeLocation}
                  onChange={handleAdminChange}
                  placeholder="e.g. Admin Building, 2nd Floor, Room 204"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                />
              </div>

              {/* Authority Scope */}
              <div>
                <label htmlFor="adminScope" className="block text-xs font-semibold text-slate-700 mb-1">
                  Governance Authority Scope
                </label>
                <input
                  type="text"
                  id="adminScope"
                  name="authorityScope"
                  value={adminForm.authorityScope}
                  onChange={handleAdminChange}
                  placeholder="e.g. Central University Event Approvals & Governance"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/50 rounded-xl text-sm font-extrabold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Administrative Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROLE 2: Club Organizer Profile */}
      {user?.role === 'organizer' && (
        <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎖️</span>
                <h2 className="text-lg font-extrabold text-[#14213D]">Club Organizer Profile</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#FCA311]/20 text-[#14213D] border border-[#FCA311]">
                  Club Executive
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Executive credentials and operational details for managing your affiliated campus club and club events.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
              Role: Organizer
            </span>
          </div>

          {profileSuccessMsg && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
              <span className="font-bold">✓</span>
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleOrganizerSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label htmlFor="orgName" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="orgName"
                  name="name"
                  value={organizerForm.name}
                  onChange={handleOrganizerChange}
                  placeholder="e.g. Organizer Name"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition bg-white"
                />
              </div>

              {/* Affiliated Club */}
              <div>
                <label htmlFor="orgClub" className="block text-xs font-semibold text-slate-700 mb-1">
                  Affiliated Club / Society
                </label>
                <select
                  id="orgClub"
                  name="clubAffiliation"
                  value={organizerForm.clubAffiliation}
                  onChange={handleOrganizerChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition bg-white font-medium text-slate-800"
                >
                  <option value="">-- Select Affiliated Club --</option>
                  {BAUST_CLUBS.map((club) => (
                    <option key={club} value={club}>
                      {club}
                    </option>
                  ))}
                </select>
              </div>

              {/* Executive Designation */}
              <div>
                <label htmlFor="orgDesignation" className="block text-xs font-semibold text-slate-700 mb-1">
                  Executive Designation / Committee Role
                </label>
                <select
                  id="orgDesignation"
                  name="designation"
                  value={organizerForm.designation}
                  onChange={handleOrganizerChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition bg-white"
                >
                  <option value="">-- Select Designation --</option>
                  {BAUST_ORGANIZER_DESIGNATIONS.map((des) => (
                    <option key={des} value={des}>
                      {des}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label htmlFor="orgDept" className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Department
                </label>
                <select
                  id="orgDept"
                  name="department"
                  value={organizerForm.department}
                  onChange={handleOrganizerChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition bg-white"
                >
                  <option value="">-- Select Department --</option>
                  {BAUST_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="orgMobile" className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Mobile / Contact
                </label>
                <input
                  type="tel"
                  id="orgMobile"
                  name="mobileNumber"
                  value={organizerForm.mobileNumber}
                  onChange={handleOrganizerChange}
                  placeholder="e.g. 01700000000"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                />
              </div>

              {/* Club Desk / Room */}
              <div>
                <label htmlFor="orgLocation" className="block text-xs font-semibold text-slate-700 mb-1">
                  Club Desk / Office Location
                </label>
                <input
                  type="text"
                  id="orgLocation"
                  name="officeLocation"
                  value={organizerForm.officeLocation}
                  onChange={handleOrganizerChange}
                  placeholder="e.g. Student Center Room 102"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                />
              </div>

              {/* Bio / Responsibilities */}
              <div className="sm:col-span-2">
                <label htmlFor="orgBio" className="block text-xs font-semibold text-slate-700 mb-1">
                  Organizer Bio &amp; Event Scope
                </label>
                <textarea
                  id="orgBio"
                  name="bio"
                  rows={3}
                  value={organizerForm.bio}
                  onChange={handleOrganizerChange}
                  placeholder="Describe your executive duties, event coordinator focus, or club activities..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-black shadow-md shadow-[#FCA311]/20 transition disabled:opacity-50 cursor-pointer"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Organizer Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROLE 3: Student Academic Profile (Participant or Default) */}
      {(user?.role === 'participant' || (!['admin', 'organizer'].includes(user?.role))) && (
        <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <h2 className="text-lg font-extrabold text-[#14213D]">Student Academic Profile</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Student
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Keep your university cohort details up to date for seamless event registration and signed QR passes.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
              Role: Participant
            </span>
          </div>

          {profileSuccessMsg && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
              <span className="font-bold">✓</span>
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label htmlFor="studentName" className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="studentName"
                  name="name"
                  value={studentForm.name}
                  onChange={handleStudentChange}
                  placeholder="e.g. Tanvir Islam"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
                />
              </div>

              {/* Department */}
              <div className="sm:col-span-2">
                <label htmlFor="department" className="block text-xs font-medium text-slate-700 mb-1">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={studentForm.department}
                  onChange={handleStudentChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition bg-white"
                >
                  <option value="">-- Select Your Department --</option>
                  {BAUST_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student ID */}
              <div>
                <label htmlFor="studentId" className="block text-xs font-medium text-slate-700 mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={studentForm.studentId}
                  onChange={handleStudentChange}
                  placeholder="e.g. 210201001"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="mobileNumber" className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={studentForm.mobileNumber}
                  onChange={handleStudentChange}
                  placeholder="e.g. 01700000000"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
                />
              </div>

              {/* Batch */}
              <div>
                <label htmlFor="batch" className="block text-xs font-medium text-slate-700 mb-1">
                  Batch
                </label>
                <input
                  type="text"
                  id="batch"
                  name="batch"
                  value={studentForm.batch}
                  onChange={handleStudentChange}
                  placeholder="e.g. 11th Batch, 12th Batch"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
                />
              </div>

              {/* Section */}
              <div>
                <label htmlFor="section" className="block text-xs font-medium text-slate-700 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  id="section"
                  name="section"
                  value={studentForm.section}
                  onChange={handleStudentChange}
                  placeholder="e.g. A, B, C"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
                />
              </div>

              {/* Level */}
              <div>
                <label htmlFor="level" className="block text-xs font-medium text-slate-700 mb-1">
                  Level
                </label>
                <select
                  id="level"
                  name="level"
                  value={studentForm.level}
                  onChange={handleStudentChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition bg-white"
                >
                  <option value="">Select Level</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                </select>
              </div>

              {/* Term */}
              <div>
                <label htmlFor="term" className="block text-xs font-medium text-slate-700 mb-1">
                  Term
                </label>
                <select
                  id="term"
                  name="term"
                  value={studentForm.term}
                  onChange={handleStudentChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition bg-white"
                >
                  <option value="">Select Term</option>
                  <option value="1">Term I</option>
                  <option value="2">Term II</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-black shadow-md shadow-[#FCA311]/20 transition disabled:opacity-50 cursor-pointer"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Student Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danger Zone: Account Deletion */}
      <div className="bg-white rounded-xl shadow-sm border border-rose-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-rose-600 font-bold">⚠️</span>
              <h2 className="text-base font-bold text-rose-700">Delete Account</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Permanently delete your user profile and registered credentials.
              Once deleted, your account cannot be recovered and you will need to sign up again to access the portal.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
          >
            {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
          </button>
        </div>
      </div>

      {/* Full Profile Photo View Modal */}
      {viewingFullPhoto && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingFullPhoto(false)}
        >
          <div
            className="relative max-w-sm sm:max-w-md w-full bg-[#0d162a] border border-white/15 rounded-3xl p-6 text-center text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>📷</span>
                <span>Profile Photo View</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingFullPhoto(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="w-56 h-56 sm:w-64 sm:h-64 mx-auto rounded-3xl overflow-hidden ring-4 ring-[#FCA311]/40 shadow-2xl bg-black flex items-center justify-center">
              {photoPreview || user?.photoURL ? (
                <img
                  src={photoPreview || user.photoURL}
                  alt={user?.name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl font-bold text-[#FCA311]">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>

            <div>
              <h4 className="text-base font-bold text-white">{user?.name}</h4>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FCA311]/15 text-[#FCA311] border border-[#FCA311]/30">
                <span className="capitalize">{user?.role}</span>
                <span>•</span>
                <span>BAUST Official</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setViewingFullPhoto(false);
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <span>📷</span>
                <span>Change / Update Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingFullPhoto(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
