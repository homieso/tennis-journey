// src/pages/Onboarding.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser, updateProfile, checkProfileExists } from '../lib/auth'
import { useTranslation } from '../lib/i18n'
import NTRPSlider from '../components/NTRPSlider'

function Onboarding() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [profileExists, setProfileExists] = useState(false)

  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    gender: '',
    playingYears: '',
    selfRatedNtrp: 3.0,
    idol: '',
    tennisStyle: '',
    customStyle: '',
    age: '',
    location: '',
    equipment: '',
    injuryHistory: '',
    shortTermGoal: ''
  })

  useEffect(() => {
    checkUserAndProfile()
  }, [])

  const checkUserAndProfile = async () => {
    const { user } = await getCurrentUser()
    if (!user) {
      navigate('/login')
      return
    }
    setUser(user)
    const { exists } = await checkProfileExists(user.id)
    setProfileExists(exists)
    if (exists) {
      loadProfileData(user.id)
    }
  }

  const loadProfileData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      setFormData({
        username: data.username || '',
        bio: data.bio || '',
        gender: data.gender || '',
        playingYears: data.playing_years || '',
        selfRatedNtrp: data.self_rated_ntrp || 3.0,
        idol: data.idol || '',
        tennisStyle: data.tennis_style || '',
        customStyle: '',
        age: data.age || '',
        location: data.location || '',
        equipment: data.equipment || '',
        injuryHistory: data.injury_history || '',
        shortTermGoal: data.short_term_goal || ''
      })
    } catch (error) {
      console.error(t('onboarding.error.load_failed'), error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNtrpChange = (value) => {
    setFormData(prev => ({ ...prev, selfRatedNtrp: value }))
  }

  const handleStyleChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      tennisStyle: value,
      customStyle: value === 'Custom/Diverse' ? prev.customStyle : ''
    }))
  }

  const validateForm = () => {
    if (!formData.username.trim()) return t('onboarding.validation.username_required')
    if (!formData.gender) return t('onboarding.validation.gender_required')
    if (!formData.playingYears) return t('onboarding.validation.playing_years_required')
    if (formData.playingYears < 0 || formData.playingYears > 70) return t('onboarding.validation.playing_years_invalid')
    if (!formData.idol.trim()) return t('onboarding.validation.idol_required')
    if (!formData.tennisStyle) return t('onboarding.validation.style_required')
    if (formData.tennisStyle === 'Custom/Diverse' && !formData.customStyle.trim()) {
      return t('onboarding.validation.custom_style_required')
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    const finalStyle = formData.tennisStyle === 'Custom/Diverse' 
      ? formData.customStyle 
      : formData.tennisStyle

    const { error } = await updateProfile(user.id, {
      username: formData.username,
      bio: formData.bio,
      gender: formData.gender,
      playingYears: parseInt(formData.playingYears),
      selfRatedNtrp: formData.selfRatedNtrp,
      idol: formData.idol,
      tennisStyle: finalStyle,
      age: formData.age ? parseInt(formData.age) : null,
      location: formData.location,
      equipment: formData.equipment,
      injuryHistory: formData.injuryHistory,
      shortTermGoal: formData.shortTermGoal
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    alert(t('onboarding.success.save'))
  }

  const styleOptions = [
    'Baseline Player',
    'Serve & Volley',
    'All-Court Player',
    'Defensive Counterpuncher',
    'Big Server',
    'Custom/Diverse'
  ]

  const genderOptions = [
    t('onboarding.gender.male'),
    t('onboarding.gender.female'),
    t('onboarding.gender.other'),
    t('onboarding.gender.prefer_not')
  ]

  return (
    <div className="min-h-screen bg-wimbledon-white py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-wimbledon text-3xl font-bold text-wimbledon-green mb-2">
            {profileExists ? t('onboarding.title.edit') : t('onboarding.title.new')}
          </h1>
          <p className="mt-2 text-gray-600">
            {profileExists ? t('onboarding.edit_description') : t('onboarding.new_description')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('onboarding.section.basic')}</h2>
              
              {/* Username */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.label.username')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder={t('onboarding.placeholder.username')}
                />
              </div>

              {/* Bio */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.label.bio')}
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder={t('onboarding.placeholder.bio')}
                />
              </div>

              {/* Gender */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.label.gender')} <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  {genderOptions.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={formData.gender === option}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-wimbledon-grass"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Playing Years */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.label.playing_years')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="playingYears"
                  min="0"
                  max="70"
                  value={formData.playingYears}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder={t('onboarding.placeholder.playing_years')}
                />
              </div>

              {/* NTRP */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.label.ntrp')} <span className="text-red-500">*</span>
                </label>
                <NTRPSlider 
                  value={formData.selfRatedNtrp}
                  onChange={handleNtrpChange}
                />
              </div>

              {/* Idol */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.label.idol')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="idol"
                  value={formData.idol}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder={t('onboarding.placeholder.idol')}
                />
              </div>

              {/* Tennis Style */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.label.style')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="tennisStyle"
                  value={formData.tennisStyle}
                  onChange={handleStyleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white"
                >
                  <option value="">{t('onboarding.select_placeholder')}</option>
                  {styleOptions.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              {/* Custom Style */}
              {formData.tennisStyle === 'Custom/Diverse' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('onboarding.label.custom_style')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customStyle"
                    value={formData.customStyle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    placeholder={t('onboarding.placeholder.custom_style')}
                  />
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('onboarding.section.additional')}</h2>
              <p className="text-xs text-gray-500 mb-4">{t('onboarding.additional_hint')}</p>
              
              {/* Age */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.label.age')}
                </label>
                <input
                  type="number"
                  name="age"
                  min="5"
                  max="100"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder={t('onboarding.placeholder.age')}
                />
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.label.location')}
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder={t('onboarding.placeholder.location')}
                />
              </div>

              {/* Equipment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.label.equipment')}
                </label>
                <input
                  type="text"
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder={t('onboarding.placeholder.equipment')}
                />
              </div>

              {/* Injury History */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.label.injury')}
                </label>
                <textarea
                  name="injuryHistory"
                  value={formData.injuryHistory}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder={t('onboarding.placeholder.injury')}
                />
              </div>

              {/* Short-term Goal */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.label.goal')}
                </label>
                <textarea
                  name="shortTermGoal"
                  value={formData.shortTermGoal}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder={t('onboarding.placeholder.goal')}
                />
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-wimbledon-grass hover:bg-wimbledon-green text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? t('onboarding.button.saving') : 
                 profileExists ? t('onboarding.button.update') : t('onboarding.button.save')}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/challenge')}
                className="w-full bg-white border border-wimbledon-grass text-wimbledon-grass hover:bg-wimbledon-grass/5 font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                {t('onboarding.button.later')}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              {t('onboarding.footer.required_note')}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Onboarding