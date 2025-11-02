export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <div className="glass-card px-8 py-10">
          <h1 className="text-3xl font-bold text-slate-800">Account settings</h1>
          <p className="mt-4 text-sm text-slate-600">
            Customize your profile, notifications, and privacy controls.
          </p>

          <div className="mt-8 grid gap-4">
            <a
              href="/settings/profile"
              className="block rounded-xl border border-slate-200 bg-white px-6 py-4 hover:border-primary-300 hover:shadow-sm transition"
            >
              <div className="font-semibold text-slate-800">Profile & Location</div>
              <div className="text-sm text-slate-600">Update your display name, photo, and ZIP code for local frost dates</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
