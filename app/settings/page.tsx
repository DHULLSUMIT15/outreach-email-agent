"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Building, User, Briefcase, Zap, Key, Mail, Shield } from "lucide-react";
import { getProfile, saveProfile, seedDemoData, testZohoConnection } from "../lib/actions";
import { CompanyProfile } from "../lib/types";

const EMPTY_PROFILE: CompanyProfile = {
  founderName: "",
  founderRole: "",
  companyName: "",
  oneLiner: "",
  sector: "",
  stage: "",
  amountRaising: "",
  roundStructure: "",
  alreadyCommitted: "",
  problem: "",
  insight: "",
  product: "",
  differentiator: "",
  revenue: "",
  users: "",
  growthRate: "",
  loisWaitlist: "",
  otherProof: "",
  tamSam: "",
  comparableExits: "",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<CompanyProfile>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [zohoEmail, setZohoEmail] = useState("");
  const [zohoPassword, setZohoPassword] = useState("");
  const [zohoRegion, setZohoRegion] = useState("smtp.zoho.in");
  const [dpdpEnabled, setDpdpEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "api" | "email">("profile");
  
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"none" | "success" | "error">("none");
  const [connectionMessage, setConnectionMessage] = useState("");

  useEffect(() => {
    seedDemoData().then(async () => {
      const existing = await getProfile();
      if (existing) setProfile(existing);
      const savedKey = typeof window !== "undefined" ? localStorage.getItem("outreach_api_key") : null;
      if (savedKey) setApiKey(savedKey);
      
      const savedZohoEmail = typeof window !== "undefined" ? localStorage.getItem("zoho_email") : null;
      const savedZohoPass = typeof window !== "undefined" ? localStorage.getItem("zoho_password") : null;
      const savedZohoRegion = typeof window !== "undefined" ? localStorage.getItem("zoho_region") : null;
      const savedDpdp = typeof window !== "undefined" ? localStorage.getItem("dpdp_enabled") : null;
      if (savedZohoEmail) setZohoEmail(savedZohoEmail);
      if (savedZohoPass) setZohoPassword(savedZohoPass);
      if (savedZohoRegion) setZohoRegion(savedZohoRegion);
      if (savedDpdp !== null) setDpdpEnabled(savedDpdp === "true");
    });
  }, []);

  const handleTestConnection = async () => {
    if (!zohoEmail || !zohoPassword) {
      setConnectionStatus("error");
      setConnectionMessage("Please enter email and password first.");
      return;
    }
    
    setTestingConnection(true);
    setConnectionStatus("none");
    try {
      await testZohoConnection({ user: zohoEmail, pass: zohoPassword, host: zohoRegion });
      setConnectionStatus("success");
      setConnectionMessage("✓ Connected! Credentials auto-saved.");
      // Auto-save credentials so Send Now works immediately
      if (typeof window !== "undefined") {
        localStorage.setItem("zoho_email", zohoEmail);
        localStorage.setItem("zoho_password", zohoPassword);
        localStorage.setItem("zoho_region", zohoRegion);
      }
    } catch (err: any) {
      setConnectionStatus("error");
      setConnectionMessage(err.message || "Failed to connect");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    await saveProfile(profile);
    if (typeof window !== "undefined") {
      localStorage.setItem("outreach_api_key", apiKey);
      localStorage.setItem("zoho_email", zohoEmail);
      localStorage.setItem("zoho_password", zohoPassword);
      localStorage.setItem("zoho_region", zohoRegion);
      localStorage.setItem("dpdp_enabled", dpdpEnabled ? "true" : "false");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const update = (field: keyof CompanyProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { key: "profile" as const, label: "Company Profile", icon: Building },
    { key: "api" as const, label: "AI & API Keys", icon: Key },
    { key: "email" as const, label: "Email Settings", icon: Mail },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Your startup profile and API configuration
          </p>
        </div>
        <button className="btn-primary" onClick={handleSave}>
          <Save size={16} />
          {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab.key ? "var(--glow-color)" : "transparent",
              color: activeTab === tab.key ? "var(--accent)" : "var(--muted)",
              border: activeTab === tab.key ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Founder */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <User size={16} style={{ color: "var(--accent)" }} />
              Founder Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Founder Name</label>
                <input className="input" placeholder="Sumit" value={profile.founderName} onChange={(e) => update("founderName", e.target.value)} />
              </div>
              <div>
                <label className="label">Role / Credibility</label>
                <input className="input" placeholder="CEO & Co-founder, ex-Razorpay" value={profile.founderRole} onChange={(e) => update("founderRole", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Company */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Building size={16} style={{ color: "var(--accent)" }} />
              Company
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Company Name</label>
                <input className="input" placeholder="BillFlow" value={profile.companyName} onChange={(e) => update("companyName", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">One-liner (12 words max)</label>
                <input className="input" placeholder="Automated GST billing for India's HORECA sector" value={profile.oneLiner} onChange={(e) => update("oneLiner", e.target.value)} />
              </div>
              <div>
                <label className="label">Sector</label>
                <input className="input" placeholder="HORECA SaaS / Fintech" value={profile.sector} onChange={(e) => update("sector", e.target.value)} />
              </div>
              <div>
                <label className="label">Stage</label>
                <select className="input" value={profile.stage} onChange={(e) => update("stage", e.target.value)}>
                  <option value="">Select...</option>
                  <option>Pre-Seed</option>
                  <option>Seed</option>
                  <option>Series A</option>
                  <option>Bridge</option>
                </select>
              </div>
            </div>
          </div>

          {/* Round */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Briefcase size={16} style={{ color: "var(--accent)" }} />
              Fundraise
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Amount Raising</label>
                <input className="input" placeholder="₹1.5 Cr" value={profile.amountRaising} onChange={(e) => update("amountRaising", e.target.value)} />
              </div>
              <div>
                <label className="label">Round Structure</label>
                <select className="input" value={profile.roundStructure} onChange={(e) => update("roundStructure", e.target.value)}>
                  <option value="">Select...</option>
                  <option>SAFE</option>
                  <option>Equity</option>
                  <option>Convertible Note</option>
                  <option>CCD</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Already Committed</label>
                <input className="input" placeholder="₹40L (30%)" value={profile.alreadyCommitted} onChange={(e) => update("alreadyCommitted", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Product & Wedge */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Zap size={16} style={{ color: "var(--accent)" }} />
              Product & Traction
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Problem (1 sentence)</label>
                <input className="input" placeholder="40% of HORECA businesses underreport GST..." value={profile.problem} onChange={(e) => update("problem", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Insight (why now, why non-obvious)</label>
                <input className="input" value={profile.insight} onChange={(e) => update("insight", e.target.value)} />
              </div>
              <div>
                <label className="label">Product</label>
                <input className="input" value={profile.product} onChange={(e) => update("product", e.target.value)} />
              </div>
              <div>
                <label className="label">Differentiator / Moat</label>
                <input className="input" value={profile.differentiator} onChange={(e) => update("differentiator", e.target.value)} />
              </div>
              <div>
                <label className="label">Revenue / ARR</label>
                <input className="input" placeholder="₹4L MRR" value={profile.revenue} onChange={(e) => update("revenue", e.target.value)} />
              </div>
              <div>
                <label className="label">Users / Customers</label>
                <input className="input" placeholder="85 outlets" value={profile.users} onChange={(e) => update("users", e.target.value)} />
              </div>
              <div>
                <label className="label">Growth Rate</label>
                <input className="input" placeholder="30% MoM" value={profile.growthRate} onChange={(e) => update("growthRate", e.target.value)} />
              </div>
              <div>
                <label className="label">LOIs / Waitlist</label>
                <input className="input" value={profile.loisWaitlist} onChange={(e) => update("loisWaitlist", e.target.value)} />
              </div>
              <div>
                <label className="label">TAM / SAM</label>
                <input className="input" value={profile.tamSam} onChange={(e) => update("tamSam", e.target.value)} />
              </div>
              <div>
                <label className="label">Comparable Exits</label>
                <input className="input" value={profile.comparableExits} onChange={(e) => update("comparableExits", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Tab */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Zap size={16} style={{ color: "var(--accent)" }} />
              AI Provider
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Groq API Key</label>
                <input
                  className="input"
                  type="password"
                  placeholder="gsk_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-[11px] mt-2" style={{ color: "var(--muted)" }}>
                  Get a free API key at{" "}
                  <a href="https://console.groq.com" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>
                    console.groq.com
                  </a>
                  . Uses Llama 3.3 70B for email generation.
                </p>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                  Supported AI Providers
                </p>
                <div className="space-y-2">
                  {[
                    { name: "Groq (Llama 3.3 70B)", status: apiKey ? "Connected" : "Not configured", active: !!apiKey },
                    { name: "OpenRouter", status: "Coming soon", active: false },
                    { name: "Ollama (Local)", status: "Coming soon", active: false },
                    { name: "Gemini Free Tier", status: "Coming soon", active: false },
                  ].map((provider) => (
                    <div key={provider.name} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "var(--foreground)" }}>
                        {provider.name}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          background: provider.active ? "rgba(16, 185, 129, 0.15)" : "var(--surface)",
                          color: provider.active ? "#10b981" : "var(--muted)",
                        }}
                      >
                        {provider.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === "email" && (
        <div className="space-y-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Mail size={16} style={{ color: "var(--accent)" }} />
              Email Provider
            </h3>
            <div
              className="p-4 rounded-xl mb-4"
              style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#818cf8" }}>
                Zoho Mail Integration
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Connect your Zoho email account to send emails directly from your inbox via SMTP.
                You must use an App-Specific Password if you have 2FA enabled on Zoho.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Zoho Region</label>
                <select
                  className="input"
                  value={zohoRegion}
                  onChange={(e) => setZohoRegion(e.target.value)}
                >
                  <option value="smtp.zoho.in">India (.in)</option>
                  <option value="smtp.zoho.com">Global (.com)</option>
                  <option value="smtp.zoho.eu">Europe (.eu)</option>
                  <option value="smtp.zoho.com.au">Australia (.com.au)</option>
                  <option value="smtp.zoho.jp">Japan (.jp)</option>
                </select>
                <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                  Select the data center where your Zoho account is hosted.
                </p>
              </div>

              <div>
                <label className="label">Zoho Email Address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="founder@yourstartup.com"
                  value={zohoEmail}
                  onChange={(e) => setZohoEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">App-Specific Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Enter app password..."
                  value={zohoPassword}
                  onChange={(e) => setZohoPassword(e.target.value)}
                />
                <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                  Go to Zoho Accounts {">"} Security {">"} App Passwords to generate one.
                </p>
              </div>
              
              <div className="pt-2 border-t border-white/10">
                <button 
                  className="btn-secondary text-sm" 
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? "Testing..." : "Test Connection"}
                </button>
                {connectionStatus !== "none" && (
                  <p className={`text-xs mt-2 font-medium ${connectionStatus === "success" ? "text-emerald-500" : "text-rose-500"}`}>
                    {connectionMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Shield size={16} style={{ color: "var(--accent)" }} />
              Safety Controls
            </h3>
            <div className="space-y-3">
              {[
                { id: "manual", label: "Require manual approval for every email", enabled: true, readOnly: true },
                { id: "autostop", label: "Auto-stop sequences on reply", enabled: true, readOnly: true },
                { id: "limit", label: "Daily send limit (30-40 emails)", enabled: true, readOnly: true },
                { id: "spam", label: "Spam word detection before send", enabled: true, readOnly: true },
                { id: "dpdp", label: "Include compliance footer (DPDP Act)", enabled: dpdpEnabled, readOnly: false },
              ].map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  onClick={() => {
                    if (!setting.readOnly && setting.id === "dpdp") {
                      setDpdpEnabled(!dpdpEnabled);
                    }
                  }}
                >
                  <span className="text-sm" style={{ color: "var(--foreground)", opacity: setting.readOnly ? 0.7 : 1 }}>
                    {setting.label} {setting.readOnly && "(Default)"}
                  </span>
                  <div
                    className={`w-10 h-6 rounded-full relative ${setting.readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                    style={{
                      background: setting.enabled
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : "var(--border)",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full absolute top-1 transition-transform bg-white"
                      style={{ left: setting.enabled ? "22px" : "4px" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
