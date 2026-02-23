export default function SettingsPage() {
  const sections = [
    {
      title: 'Profile',
      description: 'Update your name, email, and display preferences.',
      icon: '◉',
    },
    {
      title: 'AI Model Preferences',
      description: 'Choose persona voice, scoring strictness, and roleplay difficulty defaults.',
      icon: '◈',
    },
    {
      title: 'Notifications',
      description: 'Email digests, coaching reminders, and assignment alerts.',
      icon: '◎',
    },
    {
      title: 'Integrations',
      description: 'Connect to Salesforce, HubSpot, Gong, and other sales tools.',
      icon: '⬡',
    },
  ]

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 flex items-start justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/15 flex items-center justify-center text-indigo-400 text-lg flex-shrink-0">
                {section.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">{section.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{section.description}</p>
              </div>
            </div>
            <span className="text-[10px] text-white/20 bg-white/5 border border-white/8 rounded-full px-2.5 py-1 ml-4 flex-shrink-0 self-center">
              Coming soon
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-xs text-white/20">
        SalesOS v3 · Built for enterprise sales teams
      </div>
    </div>
  )
}
