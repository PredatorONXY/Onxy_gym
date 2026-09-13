// src/app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    goal: "",
    activity_level: "",
    allergies: ""
  });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push("/auth/login");
      return;
    }
    setUserId(storedUserId);

    // Fetch existing profile data
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile?userId=${storedUserId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setForm({
              age: data.profile.age?.toString() || "",
              gender: data.profile.gender || "",
              weight: "",
              height: "",
              goal: data.profile.goals || "",
              activity_level: "",
              allergies: ""
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) return;

    setLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: "User", // This would come from auth in real implementation
          role: "client", // This would be determined from auth
          clientData: {
            age: parseInt(form.age),
            gender: form.gender,
            goals: form.goal
          }
        }),
      });

      if (response.ok) {
        alert("Profile saved!");
        router.push("/dashboard/client");
      } else {
        alert("Error saving profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
          required
          className="input border p-2 rounded"
        />
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          required
          className="input border p-2 rounded"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <input
          type="number"
          name="weight"
          placeholder="Weight (kg)"
          value={form.weight}
          onChange={handleChange}
          className="input border p-2 rounded"
        />
        <input
          type="number"
          name="height"
          placeholder="Height (cm)"
          value={form.height}
          onChange={handleChange}
          className="input border p-2 rounded"
        />
        <select
          name="goal"
          value={form.goal}
          onChange={handleChange}
          required
          className="input border p-2 rounded"
        >
          <option value="">Select Goal</option>
          <option value="muscle">Muscle Gain</option>
          <option value="fat_loss">Fat Loss</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select
          name="activity_level"
          value={form.activity_level}
          onChange={handleChange}
          className="input border p-2 rounded"
        >
          <option value="">Activity Level</option>
          <option value="sedentary">Sedentary</option>
          <option value="moderate">Moderate</option>
          <option value="active">Active</option>
        </select>
        <input
          type="text"
          name="allergies"
          placeholder="Allergies (comma separated)"
          value={form.allergies}
          onChange={handleChange}
          className="input border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
