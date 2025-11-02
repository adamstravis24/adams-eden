# 📱 Mobile Tracker Quick Start Guide

## How to Access

### Option 1: Drawer Menu (Recommended)
1. **Open the app** on your device (scan QR code in terminal)
2. **Swipe from left edge** or tap the hamburger menu (☰) in top-left
3. **Tap "Plant Tracker"** (icon: 📈)
4. Tracker screen opens with stats dashboard

### Option 2: From Garden Screen
The old tracker tab in Garden screen still exists, but the new dedicated TrackerScreen provides a much better experience.

## What You'll See

### Stats Dashboard (Top)
```
┌─────────────┬─────────────┐
│   🌱 5      │   📋 3      │
│   Planted   │   Planned   │
└─────────────┴─────────────┘
┌─────────────┬─────────────┐
│   🍒 2      │   🌿 8      │
│ Ready to    │   Total     │
│  Harvest    │   Plants    │
└─────────────┴─────────────┘
```

### Empty State (First Time)
```
      🌱
Start Tracking Your Plants
Monitor growth from seed to harvest

[ Track Your First Plant ]
```

### Plant Cards (With Data)
```
┌────────────────────────────────┐
│ 🍅 Tomatoes          │ Planted │ ← Green header
├────────────────────────────────┤
│ ████████░░ 80% • Day 45        │ ← Progress bar
│                                │
│ ✅ Germination      Day 7      │ ← Milestones
│ ✅ Seedling         Day 21     │
│ ✅ Flowering        Day 48     │
│ ○ Ready to Harvest  Day 60     │
│                                │
│ [ 🍎 Harvest ] [ ✏️ ] [ 🗑️ ]  │ ← Actions
│                                │
│ 📍 Garden Bed 1                │ ← Info
│ 📝 Growing well!               │
└────────────────────────────────┘
```

### Planned Plants (Different Look)
```
┌────────────────────────────────┐
│ 🥕 Carrots          │ 📝 Planned│ ← Gray header
├────────────────────────────────┤
│ ℹ️ This plant is planned but   │ ← Info box
│    not yet planted. Mark as    │
│    planted to start tracking.  │
│                                │
│ [   Mark as Planted   ]        │ ← Big green button
│ [ ✏️ Edit ] [ 🗑️ Delete ]     │
└────────────────────────────────┘
```

## Quick Actions

### ➕ Add Plant
1. Tap **"Add Plant"** button (top right)
2. Type plant name in search box
3. Select from database results
4. Fill in details (variety, date, quantity, location, notes)
5. Tap **"Add Plant"**
6. ✅ Done! Plant added with calendar events created

### 📝 Mark as Planted
1. Find planned plant (gray header)
2. Tap **"Mark as Planted"** button
3. ✅ Status updates to planted
4. Progress tracking starts
5. Calendar events created automatically

### ✅ Track Milestones
1. Find planted plant (green header)
2. Tap milestone checkbox to toggle complete/incomplete
3. ✅ Progress bar and current stage update instantly
4. Changes sync to website in real-time

### 🍎 Harvest
1. Find planted plant ready to harvest
2. Tap **"Harvest"** button
3. Fill in harvest details (date, quantity, weight, notes)
4. Tap **"Complete Harvest"**
5. ✅ Saved to history, removed from tracker

### ✏️ Edit Plant
1. Tap **edit icon** (pencil) on any plant card
2. Update variety, date, quantity, location, notes
3. Tap **"Save Changes"**
4. ✅ Updates sync across all devices

### 🗑️ Delete Plant
1. Tap **delete icon** (trash can) on any plant card
2. Confirm deletion in popup
3. ✅ Plant removed from tracker

## 🔄 Real-Time Sync

### From Website → Mobile
1. Add or edit a plant on the website tracker
2. **Instantly** appears/updates in mobile app
3. No refresh needed!

### From Mobile → Website
1. Add or edit a plant in mobile app
2. **Instantly** appears/updates on website
3. Changes sync across all devices

### From Planner → Both
1. Add plant in garden planner (website)
2. Auto-adds to tracker as "planned"
3. **Instantly** appears in both website and mobile tracker
4. Mark as planted when ready

## 💡 Tips

- **Pull down to refresh** - Manually refresh the list
- **One entry per plant type** - Multiple basil plants in planner = 1 tracker entry
- **Date format** - Use YYYY-MM-DD (e.g., 2025-10-21)
- **Calendar integration** - Milestones automatically added to calendar
- **Harvest validation** - Can only harvest planted plants with valid dates
- **Cross-platform** - All changes sync instantly between website and mobile

## 🐛 Troubleshooting

### "Failed to add plant"
- Make sure you selected a plant from the database search
- Check that plant isn't already in your tracker (duplicates prevented)

### "Cannot harvest plant"
- Ensure plant status is "planted" (not planned)
- Verify plant has a valid planted date
- Try marking as planted first if showing as planned

### "Not syncing"
- Check internet connection
- Firebase may be offline - pull to refresh
- Restart app if persistent

### "Calendar events not created"
- Ensure you marked plant as "planted" (not just added)
- Check Calendar screen in app to verify events
- Events only created for planted plants, not planned

## 🎉 You're Ready!

The mobile tracker is fully set up and ready to use. Start tracking your plants and watch them grow! 🌱

---

**Need Help?** Check out MOBILE-TRACKER-COMPLETE.md for full technical documentation.
