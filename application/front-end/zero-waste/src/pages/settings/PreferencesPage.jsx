import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../providers/AuthContext";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { showToast } from "../../utils/toast";
import { settingsService } from "../../services/settingsService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function PreferencesPage() {
  const { token, logout } = useAuth();
  const { currentTheme, theme } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  
  // Privacy State
  const [privacySettings, setPrivacySettings] = useState({
    bio_privacy: 'public',
    waste_stats_privacy: 'public',
    is_anonymous: false,
    anonymous_identifier: null
  });

  // Account Deletion State
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecoveryToken, setShowRecoveryToken] = useState(null); 
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (token) {
      loadSettings();
    }
  }, [token]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // 1. Load Privacy/Anonymity Settings
      const privacyData = await settingsService.getPrivacySettings(token);
      if (privacyData.data) {
        setPrivacySettings(privacyData.data);
      }

      // 2. Load Deletion Status
      const deletionData = await settingsService.getDeletionStatus(token);
      // Backend now returns { data: { requested: bool, ... } }
      if (deletionData && deletionData.data) {
        // Only set status if 'requested' is true
        if (deletionData.data.requested) {
            setDeletionStatus(deletionData.data);
        } else {
            setDeletionStatus(null);
        }
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      showToast(t('common.error', 'An error occurred'), "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handlePrivacyChange = async (key, value) => {
    const oldSettings = { ...privacySettings };
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);

    try {
      // We send the single updated field. The backend updates what is provided.
      await settingsService.updatePrivacySettings({ [key]: value }, token);
      showToast(t('preferences.saved', 'Settings updated'), "success");
    } catch (error) {
      console.error(error);
      setPrivacySettings(oldSettings);
      showToast(t('common.error', 'Failed to update setting'), "error");
    }
  };

  const handleDeleteRequest = async () => {
    setProcessingAction(true);
    try {
      const res = await settingsService.requestDeletion(token);
      
      // The backend returns the cancel token in res.data.cancel_token
      // We MUST show this to the user because they might get logged out immediately.
      setShowRecoveryToken(res.data.cancel_token);
      setShowDeleteConfirm(false);
      
      showToast(t('preferences.deleteRequested', 'Account deletion scheduled'), "warning");
      
      // We don't strictly setDeletionStatus here because we are likely about to be logged out
      // or show the token modal instead.
    } catch (error) {
      showToast(t('common.error', 'Could not request deletion'), "error");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelDeletion = async () => {
    setProcessingAction(true);
    try {
      await settingsService.cancelDeletion(token);
      setDeletionStatus(null);
      showToast(t('preferences.deleteCancelled', 'Deletion cancelled'), "success");
    } catch (error) {
      showToast(t('common.error', 'Could not cancel deletion'), "error");
    } finally {
      setProcessingAction(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (showRecoveryToken) {
        navigator.clipboard.writeText(showRecoveryToken);
        showToast(t('preferences.tokenCopied', 'Recovery token copied!'), "success");
    }
  };

  const handleLogoutAfterDeletion = () => {
      logout();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center transition-colors duration-300" style={{ backgroundColor: currentTheme.background }}>
        <div className="h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: currentTheme.secondary }}></div>
      </div>
    );
  }

  return (
      <motion.div
        className="min-h-screen transition-colors duration-300 p-4 md:p-8"
        style={{ backgroundColor: currentTheme.background }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.main
            className="max-w-4xl mx-auto space-y-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
        >
            <h1 className="text-3xl font-bold" style={{ color: currentTheme.text }}>
            {t('preferences.title', 'Settings')}
            </h1>

            {/* 1. Privacy Settings Section */}
            <section 
            className="rounded-2xl border p-6 shadow-sm space-y-6 transition-colors duration-300"
            style={{ 
                backgroundColor: currentTheme.surface || currentTheme.background, 
                borderColor: currentTheme.border 
            }}
            >
            <div className="border-b pb-4" style={{ borderColor: currentTheme.border }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: currentTheme.text }}>
                🛡️ {t('preferences.privacy', 'Privacy & Visibility')}
                </h2>
                <p className="text-sm opacity-70 mt-1" style={{ color: currentTheme.text }}>
                {t('preferences.privacySectionDesc', 'Control who can see your profile details.')}
                </p>
            </div>

            <div className="space-y-6">
                <PrivacyOption 
                label={t('preferences.profileVisibility', 'Profile Visibility')}
                description={t('preferences.profileDesc', 'Who can view your full profile details?')}
                value={privacySettings.bio_privacy} 
                onChange={(val) => handlePrivacyChange('bio_privacy', val)}
                currentTheme={currentTheme}
                />
                
                <PrivacyOption 
                label={t('preferences.wasteStatsVisibility', 'Statistics Visibility')}
                description={t('preferences.wasteStatsDesc', 'Who can see your waste statistics?')}
                value={privacySettings.waste_stats_privacy}
                onChange={(val) => handlePrivacyChange('waste_stats_privacy', val)}
                currentTheme={currentTheme}
                />
            </div>
            </section>

            {/* 2. Anonymity Section */}
            <section 
            className="rounded-2xl border p-6 shadow-sm space-y-6 transition-colors duration-300"
            style={{ 
                backgroundColor: currentTheme.surface || currentTheme.background, 
                borderColor: currentTheme.border 
            }}
            >
            <div className="border-b pb-4" style={{ borderColor: currentTheme.border }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: currentTheme.text }}>
                👻 {t('preferences.anonymity', 'Anonymity')}
                </h2>
            </div>

            <div className="flex items-center justify-between">
                <div>
                <h3 className="font-medium" style={{ color: currentTheme.text }}>
                    {t('preferences.anonymousMode', 'Anonymous Mode')}
                </h3>
                <p className="text-sm opacity-60" style={{ color: currentTheme.text }}>
                    {t('preferences.anonDesc', 'Hide your real name and photo from non-followers.')}
                </p>
                </div>
                <button
                onClick={() => handlePrivacyChange('is_anonymous', !privacySettings.is_anonymous)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
                style={{ backgroundColor: privacySettings.is_anonymous ? currentTheme.secondary : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}
                >
                <span
                    className={`${
                    privacySettings.is_anonymous ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                />
                </button>
            </div>
            
            {privacySettings.is_anonymous && (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {t('preferences.anonNotice', 'You are currently displayed as')} <strong>{privacySettings.anonymous_identifier || "anon_..."}</strong> {t('preferences.toStrangers', 'to strangers.')}
                    </p>
                </div>
            )}
            </section>

            {/* 3. Account Deletion Section */}
            <section 
            className="rounded-2xl border p-6 shadow-sm space-y-6 border-red-200 dark:border-red-900/30 transition-colors duration-300"
            style={{ backgroundColor: currentTheme.surface || currentTheme.background }}
            >
            <div className="border-b pb-4" style={{ borderColor: currentTheme.border }}>
                <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
                ⚠️ {t('preferences.dangerZone', 'Danger Zone')}
                </h2>
            </div>

            {deletionStatus ? (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <h3 className="font-bold text-red-700 dark:text-red-400">
                    {t('preferences.deletionScheduled', 'Deletion Scheduled')}
                </h3>
                <p className="text-sm mt-1 mb-4 opacity-80" style={{ color: currentTheme.text }}>
                    {t('preferences.deletionDateInfo', 'Your account is scheduled for permanent deletion')} <strong>{dayjs(deletionStatus.delete_after).fromNow()}</strong> ({dayjs(deletionStatus.delete_after).format('YYYY-MM-DD HH:mm')}).
                </p>
                <button
                    onClick={handleCancelDeletion}
                    disabled={processingAction}
                    className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                >
                    {processingAction ? t('preferences.processing', 'Processing...') : t('preferences.cancelDeletion', 'Cancel Deletion')}
                </button>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-medium" style={{ color: currentTheme.text }}>
                    {t('preferences.deleteAccount', 'Delete Account')}
                    </h3>
                    <p className="text-sm opacity-60" style={{ color: currentTheme.text }}>
                    {t('preferences.deleteSectionDesc', 'Permanently remove your profile. This will immediately deactivate your account.')}
                    </p>
                </div>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-md whitespace-nowrap"
                >
                    {t('preferences.deleteBtn', 'Delete My Account')}
                </button>
                </div>
            )}
            </section>
        </motion.main>

        {/* Confirmation Modal */}
        <AnimatePresence>
            {showDeleteConfirm && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                onClick={() => setShowDeleteConfirm(false)}
            >
                <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-colors duration-300"
                style={{ 
                    backgroundColor: currentTheme.background,
                    borderColor: currentTheme.border
                }}
                onClick={(e) => e.stopPropagation()}
                >
                <h2 className="text-2xl font-bold mb-4 text-red-600">
                    {t('preferences.confirmDelete', 'Are you sure?')}
                </h2>
                <p className="mb-6 opacity-80" style={{ color: currentTheme.text }}>
                    {t('preferences.deleteWarning', 'You will be logged out immediately. Your data will be permanently deleted after 30 days unless you cancel using the recovery token.')}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-lg font-medium opacity-70 hover:opacity-100 transition-opacity border"
                    style={{ 
                        color: currentTheme.text,
                        borderColor: currentTheme.border
                    }}
                    >
                    {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                    onClick={handleDeleteRequest}
                    disabled={processingAction}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg flex items-center gap-2"
                    >
                    {processingAction && (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {processingAction ? t('preferences.processing', 'Processing...') : t('preferences.confirmBtn', 'Yes, Delete Account')}
                    </button>
                </div>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>

        {/* Recovery Token Modal */}
        <AnimatePresence>
            {showRecoveryToken && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            >
                <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="w-full max-w-lg rounded-2xl p-8 shadow-2xl border-2 border-red-500 relative"
                style={{ backgroundColor: currentTheme.background }}
                >
                <h2 className="text-2xl font-bold mb-2 text-red-600">
                    {t('preferences.deletionRequestedTitle', 'Deletion Requested')}
                </h2>
                <p className="mb-6 opacity-90" style={{ color: currentTheme.text }}>
                    {t('preferences.deactivationMessage', 'Your account has been deactivated. You will be logged out now.')}
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700 mb-8">
                    <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2 uppercase tracking-wide">
                        {t('preferences.saveTokenLabel', 'SAVE THIS RECOVERY TOKEN:')}
                    </p>
                    <div className="flex items-center gap-2 bg-white dark:bg-black/30 p-3 rounded border border-dashed border-gray-400 mb-2">
                        <code className="text-lg font-mono flex-1 break-all dark:text-gray-200 selection:bg-yellow-200 dark:selection:bg-yellow-800">
                            {showRecoveryToken}
                        </code>
                        <button 
                            onClick={copyTokenToClipboard}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-300"
                            title={t('common.copy', 'Copy')} 
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 italic">
                        {t('preferences.tokenInstructions', 'If you want to cancel the deletion and recover your account within the next 30 days, you will need this token.')}
                    </p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleLogoutAfterDeletion}
                        className="px-6 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg w-full sm:w-auto"
                    >
                        {t('preferences.confirmLogout', 'I have saved it, Log me out')}
                    </button>
                </div>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
  );
}

function PrivacyOption({ label, description, value, onChange, currentTheme }) {
  const { t } = useLanguage(); 
  
  const options = [
    { value: 'public', label: `🌍 ${t('preferences.public', 'Public')}` },
    { value: 'followers', label: `👥 ${t('preferences.followersOnly', 'Followers Only')}` },
    { value: 'private', label: `🔒 ${t('preferences.private', 'Private')}` }
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 className="font-medium" style={{ color: currentTheme.text }}>{label}</h3>
        <p className="text-sm opacity-60" style={{ color: currentTheme.text }}>{description}</p>
      </div>
      <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none px-4 py-2 pr-8 rounded-lg border outline-none focus:ring-2 transition-all cursor-pointer min-w-[160px]"
            style={{ 
                backgroundColor: currentTheme.background, 
                borderColor: currentTheme.border,
                color: currentTheme.text,
                ringColor: currentTheme.secondary
            }}
        >
            {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 opacity-50" style={{ color: currentTheme.text }}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
      </div>
    </div>
  );
}