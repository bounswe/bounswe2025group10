import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../providers/AuthContext";
import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { showToast } from "../../utils/toast";
import { settingsService } from "../../services/settingsService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function SettingsPage() {
  const { token, logout } = useAuth();
  const { currentTheme } = useTheme();
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
      showToast(t('settings.saved', 'Settings updated'), "success");
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
      
      showToast(t('settings.deleteRequested', 'Account deletion scheduled'), "warning");
      
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
      showToast(t('settings.deleteCancelled', 'Deletion cancelled'), "success");
    } catch (error) {
      showToast(t('common.error', 'Could not cancel deletion'), "error");
    } finally {
      setProcessingAction(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (showRecoveryToken) {
        navigator.clipboard.writeText(showRecoveryToken);
        // Added translation for the toast
        showToast(t('settings.tokenCopied', 'Recovery token copied!'), "success");
    }
  };

  const handleLogoutAfterDeletion = () => {
      logout();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: currentTheme.background }}>
        <div className="h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: currentTheme.secondary }}></div>
      </div>
    );
  }

  return (
    <Navbar active="settings">
      <motion.main
        className="max-w-4xl mx-auto px-4 py-8 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold" style={{ color: currentTheme.text }}>
          {t('settings.title', 'Settings')}
        </h1>

        {/* 1. Privacy Settings Section */}
        <section 
          className="rounded-2xl border p-6 shadow-sm space-y-6"
          style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}
        >
          <div className="border-b pb-4" style={{ borderColor: currentTheme.border }}>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: currentTheme.text }}>
              🛡️ {t('settings.privacy', 'Privacy & Visibility')}
            </h2>
            <p className="text-sm opacity-70 mt-1" style={{ color: currentTheme.text }}>
              {t('settings.privacySectionDesc', 'Control who can see your profile details.')}
            </p>
          </div>

          <div className="space-y-6">
            <PrivacyOption 
              label={t('settings.profileVisibility', 'Profile Visibility')}
              description={t('settings.profileDesc', 'Who can view your full profile details?')}
              value={privacySettings.bio_privacy} 
              onChange={(val) => handlePrivacyChange('bio_privacy', val)}
              currentTheme={currentTheme}
            />
            
            <PrivacyOption 
              label={t('settings.wasteStatsVisibility', 'Statistics Visibility')}
              description={t('settings.wasteStatsDesc', 'Who can see your waste statistics?')}
              value={privacySettings.waste_stats_privacy}
              onChange={(val) => handlePrivacyChange('waste_stats_privacy', val)}
              currentTheme={currentTheme}
            />
          </div>
        </section>

        {/* 2. Anonymity Section */}
        <section 
          className="rounded-2xl border p-6 shadow-sm space-y-6"
          style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.border }}
        >
          <div className="border-b pb-4" style={{ borderColor: currentTheme.border }}>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: currentTheme.text }}>
              👻 {t('settings.anonymity', 'Anonymity')}
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium" style={{ color: currentTheme.text }}>
                {t('settings.anonymousMode', 'Anonymous Mode')}
              </h3>
              <p className="text-sm opacity-60" style={{ color: currentTheme.text }}>
                {t('settings.anonDesc', 'Hide your real name and photo from non-followers.')}
              </p>
            </div>
            <button
              onClick={() => handlePrivacyChange('is_anonymous', !privacySettings.is_anonymous)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{ backgroundColor: privacySettings.is_anonymous ? currentTheme.secondary : '#ccc' }}
            >
              <span
                className={`${
                  privacySettings.is_anonymous ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
           
          {privacySettings.is_anonymous && (
             <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                   {t('settings.anonNotice', 'You are currently displayed as')} <strong>{privacySettings.anonymous_identifier || "anon_..."}</strong> {t('settings.toStrangers', 'to strangers.')}
                </p>
             </div>
          )}
        </section>

        {/* 3. Account Deletion Section */}
        <section 
          className="rounded-2xl border p-6 shadow-sm space-y-6 border-red-200 dark:border-red-900/30"
          style={{ backgroundColor: currentTheme.background }}
        >
          <div className="border-b pb-4" style={{ borderColor: currentTheme.border }}>
            <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
              ⚠️ {t('settings.dangerZone', 'Danger Zone')}
            </h2>
          </div>

          {deletionStatus ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <h3 className="font-bold text-red-700 dark:text-red-400">
                {t('settings.deletionScheduled', 'Deletion Scheduled')}
              </h3>
              <p className="text-sm mt-1 mb-4 opacity-80" style={{ color: currentTheme.text }}>
                {t('settings.deletionDateInfo', 'Your account is scheduled for permanent deletion')} <strong>{dayjs(deletionStatus.delete_after).fromNow()}</strong> ({dayjs(deletionStatus.delete_after).format('YYYY-MM-DD HH:mm')}).
              </p>
              <button
                onClick={handleCancelDeletion}
                disabled={processingAction}
                className="px-4 py-2 rounded-lg bg-white border border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors shadow-sm"
              >
                {processingAction ? t('settings.processing', 'Processing...') : t('settings.cancelDeletion', 'Cancel Deletion')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium" style={{ color: currentTheme.text }}>
                  {t('settings.deleteAccount', 'Delete Account')}
                </h3>
                <p className="text-sm opacity-60" style={{ color: currentTheme.text }}>
                  {t('settings.deleteSectionDesc', 'Permanently remove your profile. This will immediately deactivate your account.')}
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-md whitespace-nowrap"
              >
                {t('settings.deleteBtn', 'Delete My Account')}
              </button>
            </div>
          )}
        </section>

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
                className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
                style={{ backgroundColor: currentTheme.background }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4 text-red-600">
                  {t('settings.confirmDelete', 'Are you sure?')}
                </h2>
                <p className="mb-6 opacity-80" style={{ color: currentTheme.text }}>
                  {t('settings.deleteWarning', 'You will be logged out immediately. Your data will be permanently deleted after 30 days unless you cancel using the recovery token.')}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-lg font-medium opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: currentTheme.text }}
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleDeleteRequest}
                    disabled={processingAction}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg"
                  >
                    {processingAction ? t('settings.processing', 'Processing...') : t('settings.confirmBtn', 'Yes, Delete Account')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NEW: Recovery Token Modal */}
        {/* Shown after successful deletion request because user might be logged out immediately */}
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
                className="w-full max-w-lg rounded-2xl p-8 shadow-2xl border-2 border-red-500"
                style={{ backgroundColor: currentTheme.background }}
              >
                <h2 className="text-2xl font-bold mb-2 text-red-600">
                  {/* Translated Title */}
                  {t('settings.deletionRequestedTitle', 'Deletion Requested')}
                </h2>
                <p className="mb-4" style={{ color: currentTheme.text }}>
                   {/* Translated Description */}
                   {t('settings.deactivationMessage', 'Your account has been deactivated. You will be logged out now.')}
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700 mb-6">
                    <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                        {/* Translated Label */}
                        {t('settings.saveTokenLabel', 'SAVE THIS RECOVERY TOKEN:')}
                    </p>
                    <div className="flex items-center gap-2 bg-white dark:bg-black/20 p-2 rounded border border-dashed border-gray-400">
                        <code className="text-lg font-mono flex-1 break-all dark:text-white">
                            {showRecoveryToken}
                        </code>
                        <button 
                            onClick={copyTokenToClipboard}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                            title={t('common.copy', 'Copy')} 
                        >
                            📋
                        </button>
                    </div>
                    <p className="text-xs mt-2 text-yellow-700 dark:text-yellow-300">
                        {/* Translated Instructions */}
                        {t('settings.tokenInstructions', 'If you want to cancel the deletion and recover your account within the next 30 days, you will need this token.')}
                    </p>
                </div>

                <div className="flex justify-end">
                   <button
                     onClick={handleLogoutAfterDeletion}
                     className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
                   >
                     {/* Translated Button */}
                     {t('settings.confirmLogout', 'I have saved it, Log me out')}
                   </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.main>
    </Navbar>
  );
}

function PrivacyOption({ label, description, value, onChange, currentTheme }) {
  const { t } = useLanguage(); 
  
  const options = [
    { value: 'public', label: `🌍 ${t('settings.public', 'Public')}` },
    { value: 'followers', label: `👥 ${t('settings.followersOnly', 'Followers Only')}` },
    { value: 'private', label: `🔒 ${t('settings.private', 'Private')}` }
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 className="font-medium" style={{ color: currentTheme.text }}>{label}</h3>
        <p className="text-sm opacity-60" style={{ color: currentTheme.text }}>{description}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border outline-none focus:ring-2 transition-all cursor-pointer"
        style={{ 
          backgroundColor: currentTheme.background, 
          borderColor: currentTheme.border,
          color: currentTheme.text,
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}