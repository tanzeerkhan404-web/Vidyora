import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Layers,
  Loader2,
  Plus,
  Save,
  Tag,
  Trash2,
} from 'lucide-react';
import {
  deleteLearningPackageFromDb,
  saveLearningPackageToDb,
  saveMembershipPlanToDb,
} from '../services/membershipRepository';
import type {
  FirebaseAuthUser,
  LearningCategory,
  LearningPackage,
  MembershipPlan,
} from '../types/vidyora';
import {
  validateAdminPackageEdit,
  validateAdminPlanEdit,
} from '../utils/membershipLogic';

interface AdminMembershipManagerProps {
  authUser: FirebaseAuthUser;
  plans: MembershipPlan[];
  packages: LearningPackage[];
}

export function AdminMembershipManager({
  authUser,
  plans,
  packages,
}: AdminMembershipManagerProps) {
  const [subTab, setSubTab] = useState<'plans' | 'packages'>('plans');
  const [editingPlan, setEditingPlan] = useState<MembershipPlan>(plans[0]);
  const [editingPkg, setEditingPkg] = useState<LearningPackage>(packages[0]);
  const [isCreatingNewPkg, setIsCreatingNewPkg] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectPlanToEdit = (plan: MembershipPlan) => {
    setEditingPlan({
      ...plan,
      features: [...plan.features],
      benefits: [...plan.benefits],
      usageLimits: [...plan.usageLimits],
      offer: { ...plan.offer },
    });
    setError(null);
    setSuccess(null);
  };

  const selectPackageToEdit = (pkg: LearningPackage) => {
    setIsCreatingNewPkg(false);
    setEditingPkg({
      ...pkg,
      subjects: [...pkg.subjects],
      includedResources: [...pkg.includedResources],
      featuredModules: [...pkg.featuredModules],
    });
    setError(null);
    setSuccess(null);
  };

  const startNewPackage = () => {
    setIsCreatingNewPkg(true);
    setEditingPkg({
      id: `custom-${Date.now().toString(36)}`,
      name: '',
      shortLabel: 'New Track',
      tagline: '',
      description: '',
      targetAudience: '',
      categoryLink: 'competitive',
      subjects: ['General Studies'],
      includedResources: ['Chapter-wise notes & practice quizzes'],
      featuredModules: ['Foundation Module 1'],
      active: true,
    });
    setError(null);
    setSuccess(null);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanedPlan: MembershipPlan = {
      ...editingPlan,
      name: editingPlan.name.trim(),
      tagline: editingPlan.tagline.trim(),
      priceInr: editingPlan.id === 'free' ? 0 : Math.max(0, Number(editingPlan.priceInr) || 0),
      aiDailyLimit: Math.round(Number(editingPlan.aiDailyLimit) || 40),
      features: editingPlan.features.map((f) => f.trim()).filter(Boolean),
      benefits: editingPlan.benefits.map((b) => b.trim()).filter(Boolean),
      usageLimits: editingPlan.usageLimits.map((u) => u.trim()).filter(Boolean),
      offer: {
        ...editingPlan.offer,
        label: editingPlan.offer.label.trim(),
        note: editingPlan.offer.note.trim(),
        discountPercent: Math.max(0, Math.min(90, Number(editingPlan.offer.discountPercent) || 0)),
      },
    };

    const validation = validateAdminPlanEdit(cleanedPlan);
    if (!validation.valid) {
      setError(validation.error || 'Invalid plan values.');
      return;
    }

    setSaving(true);
    try {
      await saveMembershipPlanToDb(cleanedPlan, authUser.uid);
      setSuccess(`${cleanedPlan.name} successfully update ho gaya hai!`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Plan save nahi ho paya. Admin permissions verify karein.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanedPkg: LearningPackage = {
      ...editingPkg,
      name: editingPkg.name.trim(),
      shortLabel: editingPkg.shortLabel.trim() || editingPkg.name.trim().slice(0, 20),
      tagline: editingPkg.tagline.trim(),
      description: editingPkg.description.trim(),
      targetAudience: editingPkg.targetAudience.trim(),
      subjects: editingPkg.subjects.map((s) => s.trim()).filter(Boolean),
      includedResources: editingPkg.includedResources.map((r) => r.trim()).filter(Boolean),
      featuredModules: editingPkg.featuredModules.map((m) => m.trim()).filter(Boolean),
    };

    const validation = validateAdminPackageEdit(cleanedPkg);
    if (!validation.valid) {
      setError(validation.error || 'Invalid package details.');
      return;
    }

    setSaving(true);
    try {
      await saveLearningPackageToDb(cleanedPkg, authUser.uid);
      setIsCreatingNewPkg(false);
      setSuccess(`${cleanedPkg.name} successfully save ho gaya hai!`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Learning package save nahi ho paya.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomPackage = async (pkg: LearningPackage) => {
    if (pkg.id === 'school' || pkg.id === 'college' || pkg.id === 'competitive') {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteLearningPackageFromDb(pkg.id);
      selectPackageToEdit(packages[0]);
      setSuccess(`Custom package "${pkg.name}" delete kar diya gaya.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Package delete nahi ho paya.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSubTab('plans');
            setError(null);
            setSuccess(null);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-bold transition-colors cursor-pointer ${
            subTab === 'plans'
              ? 'bg-[#0B1221] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Edit Membership Plans &amp; Offers</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubTab('packages');
            setError(null);
            setSuccess(null);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-bold transition-colors cursor-pointer ${
            subTab === 'packages'
              ? 'bg-[#0B1221] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" aria-hidden="true" />
          <span>Manage Learning Packages</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}

      {subTab === 'plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Plan Picker List */}
          <div className="lg:col-span-4 space-y-3">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPlanToEdit(p)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  editingPlan.id === p.id
                    ? 'bg-[#EDE9FE]/50 border-[#6D28D9]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-[#0B1221]">
                    {p.name}
                  </span>
                  <span className="text-sm font-extrabold text-[#6D28D9] tabular-nums">
                    ₹{p.priceInr}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  AI Limit: {p.aiDailyLimit}/day
                  {p.offer.active ? ` • Offer: ${p.offer.discountPercent}% OFF` : ''}
                </p>
              </button>
            ))}
          </div>

          {/* Plan Editor Form */}
          <form
            onSubmit={handleSavePlan}
            className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
          >
            <h3 className="font-display text-lg font-bold text-[#0B1221]">
              Editing: {editingPlan.name} ({editingPlan.id.toUpperCase()})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price (₹ INR / month)
                </label>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  disabled={editingPlan.id === 'free'}
                  value={editingPlan.priceInr}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      priceInr: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm border border-slate-300 rounded-xl disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily AI Usage Limit
                </label>
                <input
                  type="number"
                  min={5}
                  max={1000}
                  value={editingPlan.aiDailyLimit}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      aiDailyLimit: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={editingPlan.tagline}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, tagline: e.target.value })
                }
                className="w-full px-3 py-2.5 min-h-[42px] text-sm border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  rows={4}
                  value={editingPlan.features.join('\n')}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: e.target.value.split('\n'),
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Benefits (one per line)
                </label>
                <textarea
                  rows={4}
                  value={editingPlan.benefits.join('\n')}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      benefits: e.target.value.split('\n'),
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Usage Limits Text (one per line)
              </label>
              <textarea
                rows={3}
                value={editingPlan.usageLimits.join('\n')}
                onChange={(e) =>
                  setEditingPlan({
                    ...editingPlan,
                    usageLimits: e.target.value.split('\n'),
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            {/* Promotional Offer Controls */}
            {editingPlan.id !== 'free' && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-amber-700" aria-hidden="true" />
                    Promotional Offer Status
                  </span>
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-[#0B1221] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.offer.active}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          offer: { ...editingPlan.offer, active: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#6D28D9]"
                    />
                    <span>{editingPlan.offer.active ? 'Offer Active' : 'Offer Inactive'}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Offer Label
                    </label>
                    <input
                      type="text"
                      value={editingPlan.offer.label}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          offer: { ...editingPlan.offer, label: e.target.value },
                        })
                      }
                      placeholder="e.g. Board Exam Special"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={editingPlan.offer.discountPercent}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          offer: {
                            ...editingPlan.offer,
                            discountPercent: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] disabled:bg-slate-400 text-white text-sm font-bold cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="w-4 h-4" aria-hidden="true" />
              )}
              <span>Save Plan Changes</span>
            </button>
          </form>
        </div>
      )}

      {subTab === 'packages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Package List */}
          <div className="lg:col-span-4 space-y-3">
            <button
              type="button"
              onClick={startNewPackage}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-2xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add New Learning Package</span>
            </button>

            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  !isCreatingNewPkg && editingPkg.id === pkg.id
                    ? 'bg-[#EDE9FE]/50 border-[#6D28D9]'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => selectPackageToEdit(pkg)}
                    className="text-left flex-1 cursor-pointer"
                  >
                    <p className="font-display font-bold text-[#0B1221]">
                      {pkg.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {pkg.subjects.length} subjects •{' '}
                      {pkg.active ? 'Active' : 'Hidden'}
                    </p>
                  </button>
                  {pkg.id !== 'school' &&
                    pkg.id !== 'college' &&
                    pkg.id !== 'competitive' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomPackage(pkg)}
                        aria-label={`Delete ${pkg.name}`}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* Package Editor Form */}
          <form
            onSubmit={handleSavePackage}
            className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-[#0B1221]">
                {isCreatingNewPkg
                  ? 'Create New Learning Package'
                  : `Editing: ${editingPkg.name}`}
              </h3>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-[#0B1221] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPkg.active}
                  onChange={(e) =>
                    setEditingPkg({ ...editingPkg, active: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#6D28D9]"
                />
                <span>Visible to Students</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Package Name
                </label>
                <input
                  type="text"
                  value={editingPkg.name}
                  onChange={(e) =>
                    setEditingPkg({ ...editingPkg, name: e.target.value })
                  }
                  placeholder="e.g. Olympiad & Foundation Package"
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Linked Learning Category
                </label>
                <select
                  value={editingPkg.categoryLink}
                  onChange={(e) =>
                    setEditingPkg({
                      ...editingPkg,
                      categoryLink: e.target.value as Exclude<LearningCategory, 'all'>,
                    })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm border border-slate-300 rounded-xl bg-white"
                >
                  <option value="school">School Classes (1–12)</option>
                  <option value="college">College Learning</option>
                  <option value="competitive">Competitive Exams</option>
                  <option value="gk">General Knowledge</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={editingPkg.targetAudience}
                  onChange={(e) =>
                    setEditingPkg({ ...editingPkg, targetAudience: e.target.value })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Tagline
                </label>
                <input
                  type="text"
                  value={editingPkg.tagline}
                  onChange={(e) =>
                    setEditingPkg({ ...editingPkg, tagline: e.target.value })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Description
              </label>
              <textarea
                rows={3}
                value={editingPkg.description}
                onChange={(e) =>
                  setEditingPkg({ ...editingPkg, description: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subjects (one per line)
                </label>
                <textarea
                  rows={4}
                  value={editingPkg.subjects.join('\n')}
                  onChange={(e) =>
                    setEditingPkg({
                      ...editingPkg,
                      subjects: e.target.value.split('\n'),
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Included Resources (one per line)
                </label>
                <textarea
                  rows={4}
                  value={editingPkg.includedResources.join('\n')}
                  onChange={(e) =>
                    setEditingPkg({
                      ...editingPkg,
                      includedResources: e.target.value.split('\n'),
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Featured Package Modules (one per line)
              </label>
              <textarea
                rows={3}
                value={editingPkg.featuredModules.join('\n')}
                onChange={(e) =>
                  setEditingPkg({
                    ...editingPkg,
                    featuredModules: e.target.value.split('\n'),
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] disabled:bg-slate-400 text-white text-sm font-bold cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="w-4 h-4" aria-hidden="true" />
              )}
              <span>Save Package</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
