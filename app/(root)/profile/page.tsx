"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/actions/auth.action";
import { updateUserProfile } from "@/lib/actions/user.action";
import { cn } from "@/lib/utils";

const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [profileURL, setProfileURL] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/sign-in");
        return;
      }
      setUser(currentUser);
      setName(currentUser.name);
      setProfileURL(currentUser.profileURL || "");
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage({ type: "", text: "" });

    const result = await updateUserProfile({
      userId: user.id,
      name,
      profileURL,
    });

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } else {
      setMessage({ type: "error", text: result.message || "Failed to update profile." });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  if (loading) {
    return (
      <div className="flex-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-200"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full animate-fadeIn">
      <div className="card-border">
        <div className="dark-gradient rounded-2xl p-8 sm:p-12 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <div className="size-[150px] rounded-full overflow-hidden border-4 border-primary-200/30 blue-gradient flex-center shadow-lg transition-transform hover:scale-105">
                <Image
                  src={profileURL || "/user-avatar.png"}
                  alt="Profile"
                  width={150}
                  height={150}
                  className="object-cover size-full"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mt-6">{user?.name}</h1>
            <p className="text-primary-100/70">{user?.email}</p>
          </div>

          <form onSubmit={handleSave} className="form flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-primary-100 ml-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="input w-full bg-dark-300 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-200/50 transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-primary-100 ml-2">Profile Picture URL</label>
              <input
                type="url"
                value={profileURL}
                onChange={(e) => setProfileURL(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="input w-full bg-dark-300 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-200/50 transition-all"
              />
              <p className="text-xs text-light-400 ml-2 mt-1 italic">Enter a direct image link from the web.</p>
            </div>

            {message.text && (
              <div
                className={cn(
                  "p-4 rounded-xl text-sm font-medium text-center animate-fadeIn",
                  message.type === "success" ? "bg-success-100/10 text-success-100 border border-success-100/20" : "bg-destructive-100/10 text-destructive-100 border border-destructive-100/20"
                )}
              >
                {message.text}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 btn-primary py-4 rounded-full font-bold text-dark-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 btn-secondary py-4 rounded-full font-bold text-primary-200 border border-primary-200/20 transition-all hover:bg-primary-200/5 hover:scale-[1.02] active:scale-[0.98]"
              >
                Log Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
