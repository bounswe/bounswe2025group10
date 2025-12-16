import React from 'react';
import { useTheme } from '../providers/ThemeContext';
import { useLanguage } from '../providers/LanguageContext';
import { useFontSize } from '../providers/FontSizeContext';
import { motion } from 'framer-motion';

export default function Settings() {
    const { currentTheme, changeTheme, availableThemes, theme } = useTheme();
    const { t, changeLanguage, availableLanguages, language } = useLanguage();
    const { fontSize, setFontSize } = useFontSize();

    return (
        <motion.div
            className="max-w-4xl mx-auto px-4 py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1 className="text-3xl font-bold mb-8" style={{ color: currentTheme.text }}>
                {t('settings.title', 'Settings')}
            </h1>

            <div className="space-y-6">
                {/* Appearance Section */}
                <section
                    className="rounded-xl border p-6 shadow-sm"
                    style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border
                    }}
                >
                    <h2 className="text-xl font-semibold mb-4" style={{ color: currentTheme.text }}>
                        {t('settings.appearance', 'Appearance')}
                    </h2>

                    <div className="space-y-6">
                        {/* Theme Selector */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.text }}>
                                {t('common.theme', 'Theme')}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {availableThemes.map((themeOption) => (
                                    <button
                                        key={themeOption.code}
                                        onClick={() => changeTheme(themeOption.code)}
                                        className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg border transition-all
                    ${theme === themeOption.code ? 'ring-2 ring-offset-2' : 'hover:opacity-80'}
                  `}
                                        style={{
                                            borderColor: theme === themeOption.code ? currentTheme.secondary : currentTheme.border,
                                            backgroundColor: theme === themeOption.code ? currentTheme.secondary + '10' : 'transparent',
                                            color: currentTheme.text,
                                            ringColor: currentTheme.secondary
                                        }}
                                    >
                                        <span className="font-medium">{t(`themes.${themeOption.code}`)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Language Selector */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.text }}>
                                {t('common.language', 'Language')}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {availableLanguages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg border transition-all
                    ${language === lang.code ? 'ring-2 ring-offset-2' : 'hover:opacity-80'}
                  `}
                                        style={{
                                            borderColor: language === lang.code ? currentTheme.secondary : currentTheme.border,
                                            backgroundColor: language === lang.code ? currentTheme.secondary + '10' : 'transparent',
                                            color: currentTheme.text,
                                            ringColor: currentTheme.secondary
                                        }}
                                    >
                                        <span className="font-medium">{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Accessibility Section */}
                <section
                    className="rounded-xl border p-6 shadow-sm"
                    style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border
                    }}
                >
                    <h2 className="text-xl font-semibold mb-4" style={{ color: currentTheme.text }}>
                        {t('settings.accessibility', 'Accessibility')}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.text }}>
                                {t('settings.fontSize', 'Font Size')}
                            </label>
                            <p className="text-sm mb-6 opacity-70" style={{ color: currentTheme.text }}>
                                {t('settings.fontSizeDesc', 'Adjust the font size for better readability. (50% - 150% scalability)')}
                            </p>

                            <div className="grid grid-cols-5 gap-3 mb-6">
                                {[
                                    { value: 'xs', label: t('settings.xs', 'Extra Small'), percent: '50%' },
                                    { value: 'small', label: t('settings.small', 'Small'), percent: '75%' },
                                    { value: 'medium', label: t('settings.medium', 'Medium'), percent: '100%' },
                                    { value: 'large', label: t('settings.large', 'Large'), percent: '125%' },
                                    { value: 'xlarge', label: t('settings.xlarge', 'X-Large'), percent: '150%' }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setFontSize(option.value)}
                                        className={`
                                            px-4 py-3 rounded-lg border transition-all
                                            ${fontSize === option.value ? 'ring-2 ring-offset-2' : 'hover:opacity-80'}
                                        `}
                                        style={{
                                            borderColor: fontSize === option.value ? currentTheme.secondary : currentTheme.border,
                                            backgroundColor: fontSize === option.value ? currentTheme.secondary + '10' : 'transparent',
                                            color: currentTheme.text,
                                            ringColor: currentTheme.secondary
                                        }}
                                    >
                                        <div className="font-medium">{option.label}</div>
                                        <div className="text-xs opacity-70">{option.percent}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 rounded-lg bg-opacity-10 text-sm" style={{ backgroundColor: currentTheme.secondary + '15', color: currentTheme.text }}>
                                <strong>{t('common.preview', 'Preview')}: </strong>
                                <span>
                                    {t('settings.fontSizePreview', 'This is how your text will look with the selected font size.')}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section
                    className="rounded-xl border p-6 shadow-sm"
                    style={{
                        backgroundColor: currentTheme.background,
                        borderColor: currentTheme.border
                    }}
                >
                    <h2 className="text-xl font-semibold mb-4" style={{ color: currentTheme.text }}>
                        {t('settings.about', 'About')}
                    </h2>
                    <p className="text-sm opacity-70" style={{ color: currentTheme.text }}>
                        Zero Waste Application v1.0.0
                    </p>
                </section>
            </div>
        </motion.div>
    );
}
