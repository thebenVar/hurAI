"use client";

import { useState, useEffect } from "react";
import {
    User,
    Bell,
    Palette,
    Globe,
    Shield,
    Smartphone,
    Mail,
    Moon,
    Sun,
    Check,
    ChevronRight,
    LogOut,
    Link,
    MessageSquare,
    Twitter,
    Facebook,
    Linkedin,
    Bot,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAiConfiguration, saveAiConfiguration, type AiConfiguration } from "@/app/actions/settings";
import { useTheme } from "next-themes";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(false);
    const { theme, setTheme } = useTheme();
    const [twoFactor, setTwoFactor] = useState(false);
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});

    // AI Configuration State
    const [aiConfig, setAiConfig] = useState<AiConfiguration>({
        defaultModel: "GPT-4o",
        openAiKey: "",
        anthropicKey: "",
        geminiKey: ""
    });
    const [isLoadingAi, setIsLoadingAi] = useState(true);
    const [isSavingAi, setIsSavingAi] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ text: "", type: "" });

    // Load AI Config on Mount
    useEffect(() => {
        getAiConfiguration()
            .then((data) => {
                setAiConfig(data);
                setIsLoadingAi(false);
            })
            .catch((err) => {
                console.error(err);
                setIsLoadingAi(false);
            });
    }, []);

    const handleSaveAiConfig = async () => {
        setIsSavingAi(true);
        setSaveMessage({ text: "", type: "" });

        const result = await saveAiConfiguration(aiConfig);

        setIsSavingAi(false);
        if (result.success) {
            setSaveMessage({ text: "Settings saved securely.", type: "success" });
            // Re-fetch to get masked keys back if they changed
            getAiConfiguration().then(setAiConfig);
            setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
        } else {
            setSaveMessage({ text: "Failed to save settings.", type: "error" });
        }
    };

    const tabs = [
        { id: "general", label: "General", icon: Globe },
        { id: "account", label: "Account", icon: User },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "appearance", label: "Appearance", icon: Palette },
        { id: "ai", label: "AI Configuration", icon: Bot },
        { id: "integrations", label: "Integrations", icon: Link },
        { id: "security", label: "Security", icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-800/50 p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-8">Settings</h1>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 p-4">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                        activeTab === tab.id
                                            ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 dark:text-slate-50"
                                    )}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 px-3">
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8">
                        {activeTab === "general" && (
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">General Settings</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your workspace preferences.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Workspace Name</label>
                                        <input
                                            type="text"
                                            defaultValue="Global Translation Services"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</label>
                                        <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-900">
                                            <option>English (US)</option>
                                            <option>Spanish</option>
                                            <option>French</option>
                                            <option>German</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "account" && (
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">Account</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Update your personal information.</p>
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-20 w-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold">
                                        B
                                    </div>
                                    <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                                        Change Avatar
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
                                        <input
                                            type="text"
                                            defaultValue="Raju"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
                                        <input
                                            type="text"
                                            defaultValue="Kumar"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                                    <input
                                        type="email"
                                        defaultValue="raju@example.com"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">Notifications</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Choose how you want to be notified.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <Mail className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Email Notifications</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Receive daily summaries</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setEmailNotifs(!emailNotifs)}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                                emailNotifs ? "bg-indigo-600" : "bg-slate-200"
                                            )}
                                        >
                                            <span className={cn(
                                                "inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-900 transition-transform",
                                                emailNotifs ? "translate-x-6" : "translate-x-1"
                                            )} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <Smartphone className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Push Notifications</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Real-time alerts on mobile</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setPushNotifs(!pushNotifs)}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                                pushNotifs ? "bg-indigo-600" : "bg-slate-200"
                                            )}
                                        >
                                            <span className={cn(
                                                "inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-900 transition-transform",
                                                pushNotifs ? "translate-x-6" : "translate-x-1"
                                            )} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "appearance" && (
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">Appearance</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Customize the look and feel.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-left transition-all",
                                            theme !== 'dark'
                                                ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 dark:border-slate-600"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                                <Sun className="h-5 w-5 text-amber-500" />
                                            </div>
                                            {theme !== 'dark' && <Check className="h-4 w-4 text-indigo-600" />}
                                        </div>
                                        <p className="font-medium text-slate-900 dark:text-slate-50">Light Mode</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Default appearance</p>
                                    </button>

                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-left transition-all",
                                            theme === 'dark'
                                                ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 dark:border-slate-600"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2 bg-slate-900 rounded-lg shadow-sm">
                                                <Moon className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            {theme === 'dark' && <Check className="h-4 w-4 text-indigo-600" />}
                                        </div>
                                        <p className="font-medium text-slate-900 dark:text-slate-50">Dark Mode</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Easy on the eyes</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">Security</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Protect your account.</p>
                                </div>
                                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                            <Key className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Change Password</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Last changed 3 months ago</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:text-slate-400" />
                                </button>

                                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Two-Factor Authentication</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setTwoFactor(!twoFactor)}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                            twoFactor ? "bg-indigo-600" : "bg-slate-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-900 transition-transform",
                                            twoFactor ? "translate-x-6" : "translate-x-1"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "ai" && (
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">AI Configuration</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your LLM API keys and preferences securely.</p>
                                </div>

                                {isLoadingAi ? (
                                    <div className="flex items-center justify-center p-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Default Model</label>
                                                <select
                                                    value={aiConfig.defaultModel}
                                                    onChange={(e) => setAiConfig(prev => ({ ...prev, defaultModel: e.target.value }))}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-900"
                                                >
                                                    <option value="GPT-4o">GPT-4o</option>
                                                    <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                                                    <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">OpenAI API Key</label>
                                                <div className="relative">
                                                    <input
                                                        type={showKey.openai ? "text" : "password"}
                                                        placeholder="sk-..."
                                                        value={aiConfig.openAiKey}
                                                        onChange={(e) => setAiConfig(prev => ({ ...prev, openAiKey: e.target.value }))}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10 font-mono text-sm"
                                                    />
                                                    <button
                                                        onClick={() => setShowKey(prev => ({ ...prev, openai: !prev.openai }))}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                                                    >
                                                        {showKey.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Anthropic API Key</label>
                                                <div className="relative">
                                                    <input
                                                        type={showKey.anthropic ? "text" : "password"}
                                                        placeholder="sk-ant-..."
                                                        value={aiConfig.anthropicKey}
                                                        onChange={(e) => setAiConfig(prev => ({ ...prev, anthropicKey: e.target.value }))}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10 font-mono text-sm"
                                                    />
                                                    <button
                                                        onClick={() => setShowKey(prev => ({ ...prev, anthropic: !prev.anthropic }))}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                                                    >
                                                        {showKey.anthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Google Gemini API Key</label>
                                                <div className="relative">
                                                    <input
                                                        type={showKey.gemini ? "text" : "password"}
                                                        placeholder="AIza..."
                                                        value={aiConfig.geminiKey}
                                                        onChange={(e) => setAiConfig(prev => ({ ...prev, geminiKey: e.target.value }))}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10 font-mono text-sm"
                                                    />
                                                    <button
                                                        onClick={() => setShowKey(prev => ({ ...prev, gemini: !prev.gemini }))}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                                                    >
                                                        {showKey.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex items-center justify-end gap-4">
                                            {saveMessage.text && (
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    saveMessage.type === "success" ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {saveMessage.text}
                                                </span>
                                            )}
                                            <button
                                                onClick={handleSaveAiConfig}
                                                disabled={isSavingAi}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {isSavingAi && <Loader2 className="h-4 w-4 animate-spin" />}
                                                Save Configuration
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === "integrations" && (
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">Integrations</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Connect with other services.</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Public Forums */}
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                <MessageSquare className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Public Forums</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Connect to community discussions</p>
                                            </div>
                                        </div>
                                        <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                                            Connect
                                        </button>
                                    </div>

                                    {/* Social Media */}
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-sky-50 rounded-lg text-sky-500">
                                                <Twitter className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Twitter / X</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Monitor brand mentions</p>
                                            </div>
                                        </div>
                                        <button className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
                                            Configure
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
                                                <Linkedin className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">LinkedIn</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Sync company updates</p>
                                            </div>
                                        </div>
                                        <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                                            Connect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Key({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
    );
}
